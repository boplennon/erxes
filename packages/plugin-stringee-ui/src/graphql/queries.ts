const detail = `
  query stringee($conversationId: String!) {
      stringeeConversationDetail(conversationId: $conversationId) {
          _id
          mailData
      }
  }
`;

const accounts = `
  query stringeeAccounts {
    stringeeAccounts 
  }
`;

export default {
  detail,
  accounts
};
