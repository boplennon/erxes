import * as dotenv from 'dotenv';
import { sendMessage } from '@erxes/api-utils/src/core';
import type { MessageArgsOmitService } from '@erxes/api-utils/src/core';
import { consumeRPCQueue } from '@erxes/api-utils/src/messageBroker';

// import { Customers, Integrations, Messages } from './models';
import { generateModels } from './connectionResolver';
import {  stringeeCreateIntegration } from './helpers';

dotenv.config();

export const setupMessageConsumers = async () => {
  consumeRPCQueue(
    'stringee:createIntegration',
    async ({ subdomain, data: { doc, kind } }) => {
      const models = await generateModels(subdomain);
      if (kind === "stringee") {
        return stringeeCreateIntegration(subdomain, models, doc);
      }
      return {
        status: "error",
        errorMessage: "Wrong kind"
      }
    }
  );



  consumeRPCQueue(
    'stringee:removeIntegration',
    async ({ data: { integrationId } }) => {
      // await Messages.remove({ inboxIntegrationId: integrationId });
      // await Customers.remove({ inboxIntegrationId: integrationId });
      // await Integrations.remove({ inboxId: integrationId });

      return {
        status: 'success',
      };
    }
  );
};

export const sendCoreMessage = (args: MessageArgsOmitService) => {
  return sendMessage({
    serviceName: 'core',
    ...args,
  });
};

export const sendInboxMessage = (args: MessageArgsOmitService) => {
  return sendMessage({
    serviceName: 'inbox',
    ...args,
  });
};

export const getConfig = async (subdomain, code, defaultValue?) => {
  return await sendCoreMessage({
    subdomain,
    action: "getConfig",
    data: { code, defaultValue },
    isRPC: true
  });
};