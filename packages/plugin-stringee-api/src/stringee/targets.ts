import { getOnlineUsers } from "../stringeeService";
import { usersCache } from "./usersCache";

export const activeCalls: Map<string, any> = new Map();

export const recordActiveCall = (call: {
  callId: string;
  from: string;
  to: string;
  uuid?: string;
  status?: string;
  project?: any;
  isOutbound?: boolean;
}) => {
  const { callId } = call;
  activeCalls.set(callId, { ...call, timestamp: new Date() });
};

export const updateActiveCallFromEvent = (body: any) => {
  const { call_id, callId, call_status, from, to } = body || {};
  const id = call_id || callId;
  if (!id) return;
  if (activeCalls.has(id)) {
    const prev = activeCalls.get(id) || {};
    const updated: any = { ...prev, status: call_status || prev.status || "unknown", lastEvent: body, lastEventTime: new Date() };
    try {
      if (body.customDataFromYourServer) {
        const customData = JSON.parse(body.customDataFromYourServer);
        updated.customerInfo = customData.customerInfo;
        updated.callType = customData.callType;
      }
    } catch (_) {}
    activeCalls.set(id, updated);
  } else {
    const callData: any = {
      from: from?.number || "unknown",
      to: to?.number || "unknown",
      callId: id,
      status: call_status || "unknown",
      timestamp: new Date(),
      lastEvent: body,
    };
    try {
      if (body.customDataFromYourServer) {
        const customData = JSON.parse(body.customDataFromYourServer);
        callData.customerInfo = customData.customerInfo;
        callData.callType = customData.callType;
      }
    } catch (_) {}
    activeCalls.set(id, callData);
  }
};

export const getBusyUserIds = (): string[] => {
  return Array.from(activeCalls.values())
    .filter((c: any) => c && c.status && c.status !== 'ended' && c.to)
    .map((c: any) => String(c.to));
};

export const clearActiveCalls = () => activeCalls.clear();

export const pickTarget = async (opts?: { excludeUserIds?: string[] }) => {
  let targetUserId: string | undefined;
  let isPhoneCall = false;
  let operatorPhone: string | undefined;
  const exclude = new Set((opts?.excludeUserIds || []).map(String));

  try {
    const onlineUsers = await getOnlineUsers();
    const candidates = onlineUsers.filter((u: string) => !exclude.has(String(u)));
    if (candidates.length > 0) {
      targetUserId = candidates[Math.floor(Math.random() * candidates.length)];
      return { isPhoneCall: false, targetUserId };
    }
  } catch (e) {}

  // fallback to operatorPhone from cached users
  isPhoneCall = true;
  for (const [, cacheData] of usersCache.entries()) {
    const userWithPhone = cacheData.users?.find((u: any) => !exclude.has(String(u?._id || u?.email || u?.username)) && u?.details?.operatorPhone);
    if (userWithPhone) {
      operatorPhone = userWithPhone.details.operatorPhone;
      break;
    }
  }
  return { isPhoneCall, targetUserId, operatorPhone };
};


