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

export class OpenRouterClient {
  async sendMessage(message: string, apiKey: string): Promise<string> {
    try {
      const response = await fetch(CONSTANTS.OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONSTANTS.MODEL,
          messages: [{ role: 'user', content: message }]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiClientError('Invalid API key. Please check your OpenRouter API key.', 401);
        } else if (response.status === 429) {
          throw new ApiClientError('Rate limit exceeded. Please try again later.', 429);
        } else if (response.status >= 500) {
          throw new ApiClientError('OpenRouter API server error. Please try again later.', response.status);
        }
        throw new ApiClientError(`API error: ${response.status} ${response.statusText}`, response.status);
      }

      const rawData = await response.json();
      if (!isChatResponse(rawData)) {
        throw new ApiClientError('Invalid response format from API');
      }
      return rawData.choices[0].message.content;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Handle network errors (fetch throws on network failure)
      if (error instanceof TypeError) {
        throw new ApiClientError('Network error. Please check your internet connection.', undefined, true);
      }
      throw error;
    }
  }

  async roastCode(fileContent: string, fileName: string, apiKey: string): Promise<string> {
    const systemPrompt = CONSTANTS.ROAST_SYSTEM_PROMPT;
    const userMessage = `请锐评以下代码文件：${fileName}\n\n${fileContent}`;

    try {
      const response = await fetch(CONSTANTS.OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CONSTANTS.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new ApiClientError('Invalid API key. Please check your OpenRouter API key.', 401);
        } else if (response.status === 429) {
          throw new ApiClientError('Rate limit exceeded. Please try again later.', 429);
        } else if (response.status >= 500) {
          throw new ApiClientError('OpenRouter API server error. Please try again later.', response.status);
        }
        throw new ApiClientError(`API error: ${response.status} ${response.statusText}`, response.status);
      }

      const rawData = await response.json();
      if (!isChatResponse(rawData)) {
        throw new ApiClientError('Invalid response format from API');
      }
      return rawData.choices[0].message.content;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (error instanceof TypeError) {
        throw new ApiClientError('Network error. Please check your internet connection.', undefined, true);
      }
      throw error;
    }
  }
}
