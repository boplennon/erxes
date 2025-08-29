export type UsersCacheEntry = { users: any[]; timestamp: number };
export const usersCache: Map<string, UsersCacheEntry> = new Map();
export const CACHE_TTL_MS = 5 * 60 * 1000;

export const cacheKey = (subdomain: string, integrationErxesApiId?: string) => `${subdomain}_${integrationErxesApiId}`;

export const getUsersForIntegrationWithCache = async (
  subdomain: string,
  integrationErxesApiId: string | undefined,
  memberIds: string[] | undefined,
  deps: { sendInboxMessage?: Function; sendCoreMessage: Function }
) => {
  const key = cacheKey(subdomain, integrationErxesApiId);
  const now = Date.now();
  const cached = usersCache.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) return cached.users;

  let users: any[] = [];
  if (memberIds && memberIds.length > 0) {
    users = await deps.sendCoreMessage({
      action: "users.find",
      isRPC: true,
      subdomain,
      data: { query: { _id: { $in: memberIds } } },
    });
  } else if (deps.sendInboxMessage) {
    const chanels = await deps.sendInboxMessage({
      action: "channels.find",
      isRPC: true,
      subdomain,
      data: { integrationIds: { $in: [integrationErxesApiId] } },
    });
    if (chanels && chanels.length > 0 && chanels[0].memberIds) {
      users = await deps.sendCoreMessage({
        action: "users.find",
        isRPC: true,
        subdomain,
        data: { query: { _id: { $in: chanels[0].memberIds } } },
      });
    }
  }
  usersCache.set(key, { users: users || [], timestamp: now });
  return users || [];
};

export const clearUsersCache = () => usersCache.clear();
export const getUsersCacheStats = () => ({ size: usersCache.size });

export const findUserInCache = (actor?: string) => {
  if (!actor) return undefined;
  const actorStr = String(actor);
  for (const [, entry] of usersCache.entries()) {
    const found = entry.users?.find((u: any) => {
      const id = u?._id ? String(u._id) : undefined;
      const email = u?.email ? String(u.email) : undefined;
      const username = u?.username ? String(u.username) : undefined;
      return id === actorStr || email === actorStr || username === actorStr;
    });
    console.log("FOUND -->", found)
    if (found) return found;
  }
  return undefined;
};


