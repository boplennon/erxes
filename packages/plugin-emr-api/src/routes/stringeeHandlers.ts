import { getSubdomain } from "@erxes/api-utils/src/core";
import { routeErrorHandling } from "@erxes/api-utils/src/requests";
import { createOrUpdateCustomer } from "../events";
import { generateStringeeSDKToken, getOnlineUsers } from "../stringeeService";

// In-memory store for active calls (demo purpose)
export const activeCalls: Map<string, any> = new Map();


export async function pickTargetUserId(): Promise<string> {
  let targetUserId = process.env.DEFAULT_USER_ID || "user1";
  try {
    const onlineUsers = await getOnlineUsers();
    if (onlineUsers.length > 0) {
      targetUserId = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
    }
  } catch (_e) {}
  return targetUserId;
}

export async function handleHealth(_req: any, res: any) {
  return res.json({ status: "OK" });
}

export async function handleAnswerUrl(req: any, res: any) {
  const subdomain = getSubdomain(req);
  const params = { ...(req.query || {}), ...(req.body || {}) } as any;
  console.log("params", params);
  const from = params.from;
  const to = params.to || params.to_number;
  const uuid = params.uuid;
  const callIdParam = params.callId;
  const fromInternal = params.fromInternal;
  const project = params.projectId;

  const isInternalCall = fromInternal === true || fromInternal === "true";
  const actualCallId = callIdParam || `call-${Date.now()}`;

  if (from && to) {
    activeCalls.set(actualCallId, {
      from,
      to,
      uuid,
      callId: actualCallId,
      status: isInternalCall ? "outbound" : "incoming",
      timestamp: new Date(),
      project,
      isOutbound: isInternalCall,
    });
  }

  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const eventUrl = `${baseUrl}/stringee/event_url`;

  const flowType = isInternalCall ? "internalToExternal" : "externalToInternal";
  switch (flowType) {
    case "externalToInternal": {
      if (!from || !to) break;
      const customer = await createOrUpdateCustomer(subdomain, { phone: from });
      const customData = customer || {};
      const targetUserId = await pickTargetUserId();
      const scco = [
        {
          action: "connect",
          from: { type: "external", number: from, alias: from },
          to: { type: "internal", number: targetUserId, alias: to },
          customData: JSON.stringify(customData),
          timeout: 30,
          record: false,
          continueOnFail: false,
        },
      ];
      return res.json(scco);
    }
    case "internalToExternal": {
      if (!from || !to) break;
      const customer = await createOrUpdateCustomer(subdomain, { phone: from });
      const customData = customer
      const scco = [
        {
          action: "connect",
          from: { type: "internal", number: from, alias: from },
          to: { type: "external", number: to, alias: to },
          customData: JSON.stringify(customData),
          timeout: 30,
          record: false,
          continueOnFail: false,
          event_url: eventUrl,
        },
      ];
      return res.json(scco);
    }
    default:
      break;
  }

  return res.json([{ action: "reject", reason: "call_type_not_supported" }]);
}

export async function handleEventUrl(req: any, res: any) {
  const { call_id, call_status, from, to } = req.body || {};
  const callId = call_id || req.body?.callId;
  if (callId && activeCalls.has(callId)) {
    const call = activeCalls.get(callId);
    call.status = call_status || call.status || "unknown";
    call.lastEvent = req.body;
    call.lastEventTime = new Date();
    try {
      if (req.body.customDataFromYourServer) {
        const customData = JSON.parse(req.body.customDataFromYourServer);
        call.customerInfo = customData.customerInfo;
        call.callType = customData.callType;
      }
    } catch (_e) {}
    activeCalls.set(callId, call);
  } else if (callId) {
    const callData: any = {
      from: from?.number || "unknown",
      to: to?.number || "unknown",
      callId,
      status: call_status || "unknown",
      timestamp: new Date(),
      lastEvent: req.body,
    };
    try {
      if (req.body.customDataFromYourServer) {
        const customData = JSON.parse(req.body.customDataFromYourServer);
        callData.customerInfo = customData.customerInfo;
        callData.callType = customData.callType;
      }
    } catch (_e) {}
    activeCalls.set(callId, callData);
  }
  return res.status(200).send("OK");
}

export async function handleGenerateToken(req: any, res: any) {
  const email = req.body?.email || req.body?.userId;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  try {
    const token = generateStringeeSDKToken(String(email));
    return res.json({ token });
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to generate token", details: e.message });
  }
}

export async function handleActiveCalls(_req: any, res: any) {
  const calls = Array.from(activeCalls.values());
  return res.json(calls);
}

export function clearActiveCalls() {
  activeCalls.clear();
}


