import { getSubdomain } from "@erxes/api-utils/src/core";
import { createOrUpdateCustomer, removeCountryCodeFromPhoneNumber } from "../helpers";
import { generateStringeeSDKToken, getOnlineUsers } from "../stringeeService";
import { receiveMessage } from "../receiveMessage";
import { generateModels } from "../connectionResolver";
import { getConfig, sendCoreMessage, sendInboxMessage } from "../messageBroker";
import { INTEGRATION_KINDS } from "../constants";
import { buildRecordAction, buildConnectAction } from "../stringee/scco";
import { getIntegrationByToNumber } from "../stringee/integrations";
import { getUsersForIntegrationWithCache } from "../stringee/usersCache";
import { pickTarget, activeCalls, recordActiveCall, updateActiveCallFromEvent } from "../stringee/targets";
import { getCachedConfig } from "../stringee/configCache";



export async function handleHealth(_req: any, res: any) {
  return res.json({ status: "OK" });
}

export async function handleAnswerUrl(req: any, res: any)  {
  const subdomain = getSubdomain(req);
  const models = await generateModels(subdomain);
  console.log("handleAnswerUrl: ", req.query)
  getConfig(subdomain, 'ERKHET', {})
  const params = { ...(req.query || {}), ...(req.body || {}) } as any;
  const from =  removeCountryCodeFromPhoneNumber(params.from);
  const to = removeCountryCodeFromPhoneNumber(params.to || params.to_number);
  const uuid = params.uuid;
  const callIdParam = params.callId;
  const fromInternal = params.fromInternal;
  const project = params.projectId;

  const isInternalCall = fromInternal === true || fromInternal === "true";
  const actualCallId = callIdParam || `call-${Date.now()}`;

  if (from && to) recordActiveCall({ from, to, uuid, callId: actualCallId, status: isInternalCall ? "outbound" : "incoming", project, isOutbound: isInternalCall });

  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const eventUrl = `${baseUrl}/stringee/event_url`;

  const flowType = isInternalCall ? "internalToExternal" : "externalToInternal";
  switch (flowType) {
    case "externalToInternal": {
      if (!from || !to) break;
      const customer = await createOrUpdateCustomer(subdomain, { phone: from });
      const customData = customer || {};
      
      const integration = await getIntegrationByToNumber(models, to);
      
      try {
        if (integration) {
          await getUsersForIntegrationWithCache(
            subdomain,
            integration.erxesApiId,
            integration.memberIds,
            { sendInboxMessage, sendCoreMessage }
          );
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
      
      // Lấy target user và kiểm tra có cần gọi điện thoại không
      // Loại trừ các user đang bận (đang có activeCalls với status khác 'ended')
      const busyUserIds = Array.from(activeCalls.values())
        .filter((c: any) => c && c.status && c.status !== 'ended' && c.to)
        .map((c: any) => String(c.to));

      const { targetUserId, isPhoneCall, operatorPhone } = await pickTarget({ excludeUserIds: busyUserIds });
      
      let scco: any[] = [buildRecordAction()];
      
      if (isPhoneCall && operatorPhone) {
        // Flow 4: Gọi trực tiếp đến số điện thoại
        console.log("Using phone call flow to:", operatorPhone);
        scco.push(
          buildConnectAction({
            fromType: "external",
            fromNumber: from,
            fromAlias: to,
            toType: "external",
            toNumber: operatorPhone,
            toAlias: operatorPhone,
            customData,
          })
        );
      } else {
        // Flow cũ: Gọi đến internal user
        console.log("Using internal user flow to:", targetUserId);
        scco.push(
          buildConnectAction({
            fromType: "external",
            fromNumber: from,
            fromAlias: from,
            toType: "internal",
            toNumber: targetUserId!,
            toAlias: to,
            customData,
          })
        );
      }
      
      return res.json(scco);
    }
    case "internalToExternal": {
      if (!from || !to) break;
      const customer = await createOrUpdateCustomer(subdomain, { phone: from });
      const customData = customer;
      const scco = [
        {
          action: "connect",
          from: { type: "internal", number: from, alias: from },
          to: { type: "external", number: to, alias: to },
          customData: JSON.stringify(customData),
          timeout: 30,
          record: true,
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
  const subdomain = getSubdomain(req);
  const models = await generateModels(subdomain);

  const { call_id } = req.body || {};
  console.log("handleEventUrl: ", req.body)
  await receiveMessage(models, subdomain, req.body);
  updateActiveCallFromEvent(req.body);
  return res.status(200).send("OK");
}

export async function handleGenerateToken(req: any, res: any) {
  const subdomain = getSubdomain(req);

 const accessKey = await getCachedConfig(subdomain, "STRINGEE_ACCESS_TOKEN", getConfig);
 const accountId = await getCachedConfig(subdomain, "STRINGEE_ACCESS_KEY", getConfig);

  const email = req.body?.email || req.body?.userId;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }
  try {
    const token = generateStringeeSDKToken(String(email), accessKey, accountId);
    return res.json({ token });
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to generate token", details: e.message });
  }
}



