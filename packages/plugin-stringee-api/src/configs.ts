import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { setupMessageConsumers } from "./messageBroker";
import init from "./controller";
import { getSubdomain } from "@erxes/api-utils/src/core";
import { generateModels } from "./connectionResolver";

export default {
  name: "stringee",
  graphql: () => {
    return {
      typeDefs,
      resolvers,
    };
  },
  meta: {
    inboxIntegration: {
      kind: "stringee",
      label: "Stringee",
    },
  },
  apolloServerContext: async (context, req) => {
    const subdomain = getSubdomain(req);
    const models = await generateModels(subdomain);

    context.subdomain = subdomain;
    context.models = models;

    return context;
  },

  onServerInit: async () => {
    await init();
  },
  setupMessageConsumers,
};
