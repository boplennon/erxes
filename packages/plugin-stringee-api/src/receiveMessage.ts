import { IModels } from "./connectionResolver";
import { sendInboxMessage } from "./messageBroker";
import { getOrCreateCustomer } from "./store";
// import { IMessageData } from "./types";
import graphqlPubsub from "@erxes/api-utils/src/graphqlPubsub";
import { INTEGRATION_KINDS } from "./constants";
import { downloadAndUploadStringeeRecording } from "./utils";
import { buildCallEventContent } from "./stringee/events";
import { ensureConversation, createConversationMessage } from "./stringee/conversations";
import { getIntegrationByToNumber } from "./stringee/integrations";
import { debugError } from "./debuggers";
import { debugInfo } from "@erxes/api-utils/src/debuggers";
import { StringeeCallEvent } from "./stringee/types";
import { removeCountryCodeFromPhoneNumber } from "./helpers";
import { findUserInCache } from "./stringee/usersCache";
import { generateAttachmentUrl } from "./commonUtils";

export const receiveMessage = async (
  models: IModels,
  subdomain: string,
  messageData: StringeeCallEvent
): Promise<void> => {
  const { callCreatedReason, from, to, event_id, call_status, duration, answerDuration, endCallCause, endedBy, actor, timestamp_ms } = messageData;

  try {
    const toNumber = removeCountryCodeFromPhoneNumber(to.alias || to.number);
    const integration = await getIntegrationByToNumber(models, to.alias || to.number);

    if (!integration) {
      throw new Error("stringee Integration not found");
    }

    console.log("to.number!!!: ", toNumber, integration);
    const fromNumber = removeCountryCodeFromPhoneNumber(from.number);
    const customer = await getOrCreateCustomer(
      models,
      subdomain,
      fromNumber,
      integration!
    );
    console.log("customer: ", customer);
    if (!customer) {
      throw new Error("Failed to get or create customer");
    }

    let conversation = await ensureConversation(models, {
      fromNumber,
      toNumber,
      integrationId: integration._id,
      content: callCreatedReason,
    });

    const timestamp = timestamp_ms ? new Date(timestamp_ms)
        : new Date();


    const actorUser = findUserInCache(actor);
    const actorLabel = actorUser?.username || ( actorUser?.firstName ? actorUser?.firstName + " " + actorUser?.lastName: false)  || actorUser?.email || actor || 'nhân viên';

    const callEventContent = buildCallEventContent({
      call_status,
      fromNumber: from.number,
      actor: actorLabel,
      duration, 
      answerDuration,
      endCallCause,
      endedBy,
    });

    if (!conversation) {
      conversation = await models.Conversations.create({
        senderId: fromNumber,
        recipientId: toNumber,
        callCreatedReason,
        integrationId: integration._id,
      });
    } else {
      conversation.content = callEventContent;
    }

    const apiConversationResponse = await sendInboxMessage({
      subdomain,
      action: "integrations.receive",
      data: {
        action: "create-or-update-conversation",
        payload: JSON.stringify({
          customerId: customer.erxesApiId,
          integrationId: integration.erxesApiId,
          content: callEventContent,
          attachments: [],
          conversationId: conversation.erxesApiId,
          updatedAt: timestamp
        }),
      },
      isRPC: true,
    });
    

    conversation.erxesApiId = apiConversationResponse._id;
    await conversation.save();
    let conversationMessage = await models.ConversationMessages.findOne({
      mid: event_id,
    });
    if (!conversationMessage) {
      // Tạo attachments cho file ghi âm nếu cuộc gọi kết thúc và có thời gian trả lời
      let attachments: any[] = [];
      if (call_status === "ended" && answerDuration > 0) {
        try {
          const uploadedFile = await downloadAndUploadStringeeRecording(messageData.call_id, subdomain);

          if (uploadedFile) {
            attachments = [{
              type: "audio",
              url: generateAttachmentUrl(subdomain, uploadedFile),
              name: `recording_${messageData.call_id}.mp3`,
              size: uploadedFile.size || 0,
              mimeType: "audio/mpeg",
            }];
          }
        } catch (error) {
          console.error("Failed to download and upload recording:", error);
        }
      }

      const createdMessage = await createConversationMessage(models, {
        eventId: event_id,
        content: callEventContent,
        integrationId: integration._id,
        conversationId: conversation._id,
        customer,
        userId: call_status !== "answered" ? undefined : actor,
        user: call_status !== "answered" ? undefined : actorUser.details,
        createdAt: timestamp,
        attachments
      });
      await sendInboxMessage({
        subdomain,
        action: "conversationClientMessageInserted",
        data: {
          ...createdMessage.toObject(),
          conversationId: conversation.erxesApiId,
          subdomain,
          conversation,
          integration
        },
      });

      graphqlPubsub.publish(
        `conversationMessageInserted:${conversation.erxesApiId}`,
        {
          conversationMessageInserted: {
            ...createdMessage.toObject(),
            conversationId: conversation.erxesApiId,
          },
          
        }
      );
      // console.log("actor -->", actor)
      // graphqlPubsub.publish(`conversationClientMessageInserted:${actor}`, {
      //   conversationClientMessageInserted: {
      //     ...createdMessage.toObject(),
      //     conversationId: conversation.erxesApiId,
      //   },
      //   subdomain,
      //   conversation,
      //   integration
      // });
      conversationMessage = createdMessage;
      console.log("END");
    }
  } catch (error) {
    throw new Error(`Error in receiveMessage: ${error.message}`);
  }
};

async function handleMessageUpdate(messageObject, conversationId, subdomain) {
  await sendInboxMessage({
    subdomain,
    action: "conversationClientMessageInserted",
    data: { ...messageObject, conversationId },
  });

  graphqlPubsub.publish(`conversationMessageInserted:${conversationId}`, {
    conversationMessageInserted: { ...messageObject, conversationId },
  });
}

export default receiveMessage;
