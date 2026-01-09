import { CONSTANTS } from './constants';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatResponse {
  choices: Array<{
    message: ChatMessage;
  }>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function isChatResponse(obj: unknown): obj is ChatResponse {
  const data = obj as ChatResponse;
  return (
    typeof data === 'object' &&
    data !== null &&
    'choices' in data &&
    Array.isArray(data.choices) &&
    data.choices.length > 0 &&
    typeof data.choices[0]?.message?.content === 'string'
  );
}

function handleErrorResponse(response: Response): never {
  if (response.status === 401) {
    throw new ApiClientError('Invalid API key. Please check your API key.', 401);
  } else if (response.status === 429) {
    throw new ApiClientError('Rate limit exceeded. Please try again later.', 429);
  } else if (response.status >= 500) {
    throw new ApiClientError('API server error. Please try again later.', response.status);
  }
  throw new ApiClientError(`API error: ${response.status} ${response.statusText}`, response.status);
}

function handleFetchError(error: unknown): never {
  if (error instanceof ApiClientError) {
    throw error;
  }
  if (error instanceof TypeError) {
    throw new ApiClientError('Network error. Please check your internet connection.', undefined, true);
  }
  throw error;
}

export interface StreamChunkCallback {
  (chunk: string): void;
}

/**
 * Generic LLM API Client supporting OpenAI-compatible APIs.
 */
export class LlmApiClient {
  constructor(
    private defaultBaseUrl: string = CONSTANTS.DEFAULT_API_URL,
    private defaultModel: string = CONSTANTS.DEFAULT_MODEL
  ) { }

  async roastCodeStream(
    fileContent: string,
    fileName: string,
    apiKey: string,
    onChunk: StreamChunkCallback,
    baseUrl?: string,
    model?: string
  ): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const modelName = model || this.defaultModel;

    const messages: ChatMessage[] = [
      { role: 'system', content: CONSTANTS.ROAST_SYSTEM_PROMPT },
      { role: 'user', content: `请锐评以下代码文件：${fileName}\n\n${fileContent}` }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        handleErrorResponse(response);
      }

      if (!response.body) {
        throw new ApiClientError('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return fullContent;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // Ignore invalid JSON lines
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      handleFetchError(error);
    }
  }

  async roastCode(
    fileContent: string,
    fileName: string,
    apiKey: string,
    baseUrl?: string,
    model?: string
  ): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const modelName = model || this.defaultModel;

    const messages: ChatMessage[] = [
      { role: 'system', content: CONSTANTS.ROAST_SYSTEM_PROMPT },
      { role: 'user', content: `请锐评以下代码文件：${fileName}\n\n${fileContent}` }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages
        })
      });

      if (!response.ok) {
        handleErrorResponse(response);
      }

      const rawData = await response.json();
      if (!isChatResponse(rawData)) {
        throw new ApiClientError('Invalid response format from API');
      }
      return rawData.choices[0].message.content;
    } catch (error) {
      handleFetchError(error);
    }
  }

  async testConnection(
    apiKey: string,
    baseUrl?: string,
    model?: string
  ): Promise<string> {
    const url = baseUrl || this.defaultBaseUrl;
    const modelName = model || this.defaultModel;

    const messages: ChatMessage[] = [
      { role: 'user', content: CONSTANTS.TEST_MESSAGE }
    ];

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          max_tokens: 50
        })
      });

      if (!response.ok) {
        handleErrorResponse(response);
      }

      const rawData = await response.json();
      if (!isChatResponse(rawData)) {
        throw new ApiClientError('Invalid response format from API');
      }
      return 'Connection successful!';
    } catch (error) {
      handleFetchError(error);
    }
  }
}
