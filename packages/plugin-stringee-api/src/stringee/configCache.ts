export type ConfigCacheEntry = { value: string; timestamp: number };
export const configCache: Map<string, ConfigCacheEntry> = new Map();
export const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const configCacheKey = (subdomain: string, configKey: string) => `${subdomain}_${configKey}`;

export const getCachedConfig = async (
  subdomain: string,
  configKey: string,
  getConfigFn: (subdomain: string, code: string, defaultValue?: any) => Promise<any>
) => {
  const key = configCacheKey(subdomain, configKey);
  const now = Date.now();
  const cached = configCache.get(key);
  
  if (cached && now - cached.timestamp < CONFIG_CACHE_TTL_MS) {
    return cached.value;
  }

  const value = await getConfigFn(subdomain, configKey);
  configCache.set(key, { value, timestamp: now });
  return value;
};

export const clearConfigCache = () => configCache.clear();
export const getConfigCacheStats = () => ({ size: configCache.size });
