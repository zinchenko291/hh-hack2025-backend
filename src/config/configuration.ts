export default {
  ollama: {
    enabled: process.env.OLLAMA_ENABLED
      ? process.env.OLLAMA_ENABLED !== 'false'
      : true,
    host: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL ?? 'llama3.1:8b',
    temperature: process.env.OLLAMA_TEMPERATURE
      ? Number(process.env.OLLAMA_TEMPERATURE)
      : 0.2,
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 15_000,
    pullTimeoutMs:
      Number(process.env.OLLAMA_PULL_TIMEOUT_MS) || 5 * 60 * 1000,
    autoPull: process.env.OLLAMA_AUTO_PULL
      ? ['true', '1', 'yes'].includes(
          process.env.OLLAMA_AUTO_PULL.trim().toLowerCase()
        )
      : false,
  },
  summarizer: {
    fallbackCharLimit: Number(process.env.FALLBACK_CHAR_LIMIT) || 420,
    minInputLength: Number(process.env.SUMMARIZER_MIN_LENGTH) || 40,
  },
  feed: {
    maxItems: Number(process.env.MAX_ITEMS_PER_FEED) || 20,
    fetchTimeOut: Number(process.env.FETCH_TIMEOUT_MS) || 10000,
  },
  useragent: process.env.USER_AGENT ?? 'NewsAggregatorBot/1.0',
  maxCacheEntries: 500,
  cacheTTLMs: 60 * 60 * 1000,
};
