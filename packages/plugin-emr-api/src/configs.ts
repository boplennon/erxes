import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { setupMessageConsumers } from "./messageBroker";
import initApp from "./initApp";

// routes are initialized in initApp.ts

export default {
  name: "emr",
  corsOptions: {
    origin: "*",
  },
  graphql: async () => {
    return {
      typeDefs: await typeDefs(),
      resolvers: await resolvers(),
    };
  },
  meta: {
    inboxIntegration: {
      kind: 'callcenter',
      label: 'Stringee Callcenter'
    }
  },
  apolloServerContext: async (context) => {
    return context;
  },

  onServerInit: async () => {
    await initApp();
  },
  setupMessageConsumers,
};
