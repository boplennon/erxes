export const ensureConversation = async (
  models: any,
  args: { fromNumber: string; toNumber: string; integrationId: string; content?: string }
) => {
  const { fromNumber, toNumber, integrationId, content } = args;
  let conversation = await models.Conversations.findOne({ senderId: fromNumber, recipientId: toNumber });
  if (!conversation) {
    conversation = await models.Conversations.create({
      senderId: fromNumber,
      recipientId: toNumber,
      callCreatedReason: content,
      integrationId,
    });
  } else if (content) {
    conversation.content = content;
  }
  return conversation;
};

export const createConversationMessage = async (
  models: any,
  args: {
    eventId: string;
    content: string;
    integrationId: string;
    conversationId: string;
    customer: any;
    userId?: string;
    createdAt: Date;
    attachments?: any[];
    user?: any
  }
) => {
  const { eventId, content, integrationId, conversationId, customer, userId, createdAt, attachments = [], user } = args;
  const doc: any = {
    mid: eventId,
    content,
    integrationId,
    conversationId,
    customerId: userId ? undefined : customer.erxesApiId,
    customer,
    userId,
    user,
    createdAt,
    attachments,
  };
  const created = await models.ConversationMessages.create(doc);
  await created.save();
  return created;
};


