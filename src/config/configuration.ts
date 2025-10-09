export default {
  openai: {
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    fallbackCharLimit: Number(process.env.FALLBACK_CHAR_LIMIT) || 420,
  },
  feed: {
    maxItems: Number(process.env.MAX_ITEMS_PER_FEED) || 20,
    fetchTimeOut: Number(process.env.FETCH_TIMEOUT_MS) || 10000,
  },
  useragent: process.env.USER_AGENT ?? 'NewsAggregatorBot/1.0',
  maxCacheEntries: 500,
  cacheTTLMs: 60 * 60 * 1000,
  redis: {
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    ttlMs: Number(process.env.REDIS_TTL_MS) || 5 * 60 * 1000,
  },
};
