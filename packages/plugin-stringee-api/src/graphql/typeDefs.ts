import gql from 'graphql-tag';

import { attachmentType } from "@erxes/api-utils/src/commonTypeDefs";

const commonCommentAndMessageFields = `
  content: String
  conversationId: String
`;

const commonPostAndCommentFields = `
  postId: String
  recipientId: String
  senderId: String
  erxesApiId: String
  attachments: [String]
  timestamp: Date
  permalink_url: String
`;

const commentQueryParamDefs = `conversationId: String!, isResolved: Boolean`;

const pageParams = `skip: Int, limit: Int`;

export const types = `
  ${attachmentType}

  extend type Customer @key(fields: "_id") {
    _id: String @external
  }

  extend type User @key(fields: "_id") {
    _id: String! @external
  }

  type stringeeCustomer {
    _id: String
    userId: String
    erxesApiId: String
    firstName: String
    lastName: String
    profilePic: String
    integrationId: String
  }

  type stringeeConversationMessage {
    _id: String!
    ${commonCommentAndMessageFields}
    attachments: [Attachment]
    fromBot: Boolean
    botData: JSON
    customerId: String
    userId: String
    createdAt: Date
    isCustomerRead: Boolean
    mid: String
    internal: Boolean
    permalink_url:String
    postContent: String
    customer: Customer
    user: User
  }
   type BotPersistentMenuType {
    _id:String
    type:String
    text: String
    link: String
  }

  input BotPersistentMenuInput {
    _id:String
    type:String
    text: String
    link: String
  }

  type stringeeMessengerBot {
    _id: String
    name:String
    accountId: String
    account:JSON
    stringeeNumberIds: [String!]
    page: JSON
    createdAt: Date
    persistentMenus:[BotPersistentMenuType]
    profileUrl:String
    greetText:String
    tag:String
    isEnabledBackBtn:Boolean
    backButtonText:String
  }
`;
const commonBotParams = `
  name:String,
  accountId:String,
  stringeeNumberIds: [String!]
  persistentMenus:[BotPersistentMenuInput],
  greetText:String
  tag:String,
  isEnabledBackBtn:Boolean,
  backButtonText:String
`;
export const queries = `
  stringeeGetAccounts(kind: String): JSON
  stringeeGetIntegrations(kind: String): JSON
  stringeeGetIntegrationDetail(erxesApiId: String): JSON 
  stringeeGetConfigs: JSON
  stringeeGetNumbers(accountId: String! kind: String!): JSON
  stringeeConversationDetail(_id: String!): JSON
  stringeeConversationMessages(conversationId: String! getFirst: Boolean, ${pageParams}): [stringeeConversationMessage]
  stringeeConversationMessagesCount(conversationId: String!): Int
  stringeeHasTaggedMessages(conversationId: String!): Boolean
  stringeeBootMessengerBots:[stringeeMessengerBot]
  stringeeBootMessengerBotsTotalCount:Int
  stringeeBootMessengerBot(_id:String):stringeeMessengerBot
`;

export const mutations = `
  stringeeUpdateConfigs(configsMap: JSON!): JSON
  stringeeRepair(_id: String!): JSON
 stringeeMessengerAddBot(${commonBotParams}):JSON
 stringeeMessengerUpdateBot(_id:String,${commonBotParams}):JSON
 stringeeMessengerRemoveBot(_id:String):JSON
 stringeeMessengerRepairBot(_id:String):JSON
`;


const typeDefs = gql`
  scalar JSON
  scalar Date

  ${types}

  extend type Query {
    ${queries}
  }

  extend type Mutation {
    ${mutations}
  }
`;

export default typeDefs;
