
import { consumeQueue, consumeRPCQueue } from '@erxes/api-utils/src/messageBroker';
import type { MessageArgsOmitService } from "@erxes/api-utils/src/core";
import { sendMessage } from "@erxes/api-utils/src/core";

import { Emrs } from "./models";

export const setupMessageConsumers = async () => {
  consumeQueue('emr:send', async ({ data }) => {
    Emrs.send(data);

    return {
      status: 'success',
    };
  });

  consumeRPCQueue('emr:find', async ({ data }) => {
    return {
      status: 'success',
      data: await Emrs.find({})
    };
  });
};

export const sendCoreMessage = (args: MessageArgsOmitService): Promise<any> => {
  return sendMessage({
    serviceName: "core",
    ...args
  });
};