module.exports = {
  srcDir: __dirname,
  name: 'stringee',
  scope: 'stringee',
  port: 3024,
  exposes: {
    './routes': './src/routes.tsx',
    './inboxIntegrationSettings': './src/components/IntegrationSettings.tsx',
    './inboxIntegrationForm': './src/components/IntegrationForm.tsx',
    './inboxConversationDetail': './src/components/ConversationDetail.tsx'
  },
  routes: {
    url: 'http://localhost:3024/remoteEntry.js',
    scope: 'stringee',
    module: './routes'
  },
  inboxIntegrationSettings: './inboxIntegrationSettings',
  inboxIntegrationForm: './inboxIntegrationForm',
  inboxConversationDetail: './inboxConversationDetail',
   inboxDirectMessage: {
    messagesQuery: {
      query: `
        query zaloConversationMessages(
          $conversationId: String!
          $skip: Int
          $limit: Int
          $getFirst: Boolean
        ) {
          zaloConversationMessages(
            conversationId: $conversationId,
            skip: $skip,
            limit: $limit,
            getFirst: $getFirst
          ) {
            _id
            content
            conversationId
            customerId
            userId
            createdAt
            isCustomerRead
            
            attachments {
              thumbnail
              type
              url
              name
              description
              duration
              coordinates
            }

            user {
              _id
              username
              details {
                avatar
                fullName
                position
              }
            }

            customer {
              _id
              avatar
              firstName
              middleName
              lastName
              primaryEmail
              primaryPhone
              state

              companies {
                _id
                primaryName
                website
              }

              customFieldsData
              tagIds
            }
          }
        }
      `,
      name: 'zaloConversationMessages',
      integrationKind: 'zalo'
    },
    countQuery: {
      query: `
        query zaloConversationMessagesCount($conversationId: String!) {
          zaloConversationMessagesCount(conversationId: $conversationId)
        }
      `,
      name: 'zaloConversationMessagesCount',
      integrationKind: 'zalo'
    },
  },
  inboxDirectMessage: {
    messagesQuery: {
      query: `
          query stringeeConversationMessages(
            $conversationId: String!
            $skip: Int
            $limit: Int
            $getFirst: Boolean
          ) {
            stringeeConversationMessages(
              conversationId: $conversationId,
              skip: $skip,
              limit: $limit,
              getFirst: $getFirst
            ) {
              _id
              content
              conversationId
              customerId
              userId
              createdAt
              isCustomerRead
              internal
              botData

              attachments {
                url
                name
                type
                size
              }

              user {
                _id
                username
                details {
                  avatar
                  fullName
                  position
                }
              }

              customer {
                _id
                avatar
                firstName
                middleName
                lastName
                primaryEmail
                primaryPhone
                state

                companies {
                  _id
                  primaryName
                  website
                }

                customFieldsData
                tagIds
              }
            }
          }
        `,
      name: "stringeeConversationMessages",
      integrationKind: "stringee"
    },
    countQuery: {
      query: `
          query stringeeConversationMessagesCount($conversationId: String!) {
            stringeeConversationMessagesCount(conversationId: $conversationId)
          }
        `,
      name: "stringeeConversationMessagesCount",
      integrationKind: "stringee"
    }
  },  
  inboxIntegrations: [{
    name: 'Stringee',
    description:
      'Please write integration description on plugin config file',
    isAvailable: true,
    kind: 'stringee',
    logo: '/images/integrations/stringee.png',
    createModal: "stringee",
  }]
};
