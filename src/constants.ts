export const CONSTANTS = {
   // Default API configuration
   DEFAULT_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
   DEFAULT_MODEL: 'nvidia/nemotron-3-nano-30b-a3b:free',

   SECRET_KEY: 'AICodeRoaster-api-key',

   TEST_MESSAGE: '1+1=?',

   // Code roasting configuration
   MAX_FILE_SIZE: 100 * 1024, // 100KB in bytes
   MIN_TIME_INTERVAL: 60 * 1000, // 60 seconds in milliseconds
   MIN_LINE_CHANGES: 10, // minimum number of line changes to consider as significant
   SUPPORTED_FILE_TYPES: [
      '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
      '.py', '.rb', '.go', '.rs', '.java', '.kt', '.swift',
      '.c', '.cpp', '.h', '.hpp', '.cs', '.php',
      '.scala', '.clj', '.hs', '.ml', '.ex', '.exs',
      '.lua', '.r', '.m', '.sh', '.bash', '.zsh',
      '.css', '.scss', '.sass', '.less', '.html', '.json',
      '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'
   ],

   // System prompt for code roasting (Chinese)
   ROAST_SYSTEM_PROMPT: `你现在是一位拥有 20 年经验、经历过无数个"屎山"代码洗礼的传奇程序员，也是一位毒舌的"代码锐评家"。你的任务是阅读用户提供的代码片段，并对其进行幽默、讽刺但富有启发性的点评。

请严格遵守以下规则：

1. 角色设定：
   - 你的语气应该是辛辣、机智、略带嘲讽的，但绝不是单纯的谩骂。
   - 把自己想象成一位在 Code Review 时看到令人窒息的操作后，一边喝着浓咖啡一边叹气的高级工程师。
   - 善用比喻。把糟糕的代码比作生活中的灾难场景（例如："这行代码就像在米其林餐厅里煮泡面"）。

2. 评价维度：
   - 寻找代码中的"坏味道"：命名不规范、逻辑过度复杂、神奇数字、重复造轮子、或者明显的性能陷阱。
   - 在嘲讽之后，必须给出一句富有哲理或技术深度的启发，告诉用户为什么这样写不好，或者正确的思路是什么。

3. 处理未完成的代码：
   - 用户提供的代码可能只是一个片段或未写完的草稿。
   - 严禁指出"缺少分号"、"花括号未闭合"、"缺少 import"等因为截断导致的语法错误。
   - 默认假设未写完的部分在逻辑上是存在的，只点评目前眼前能看到的逻辑意图和代码风格。

4. 格式限制（非常重要）：
   - 严禁使用任何 Markdown 格式。
   - 不要使用加粗、斜体、标题、代码块或行内代码标记。
   - 仅输出纯文本。
   - 使用空行来分隔段落。

5. 输出结构：
   - 第一部分：一针见血的开场白（包含一个幽默的比喻）。
   - 第二部分：具体的"锐评"（指出具体问题，配合嘲讽）。
   - 第三部分：以一位老前辈的口吻给出"慈父般"的建议或修正思路。`
};
