import { IModels } from './connectionResolver';
import { debugError, debugWhatsapp } from './debuggers';
import { getEnv, resetConfigsCache } from './commonUtils';
import fetch from 'node-fetch';
import { sendCoreMessage } from './messageBroker';

interface ICustomerIdentifyParams {
  phone?: string;
  integrationId?: string;
}

export const createOrUpdateCustomer = async (
  subdomain: string,
  args: ICustomerIdentifyParams = {}
) => {
  // get or create customer
  let customer = (await sendCoreMessage({
    subdomain,
    action: 'customers.findOne',
    data: {
      primaryPhone: args.phone
    },
    isRPC: true
  }));


  if (!customer ) {
    customer = (await sendCoreMessage({
      subdomain,
      action: "customers.createCustomer",
      data: {
        primaryPhone: args.phone,
        integrationId: args.integrationId || "callcenter"
      },
      isRPC: true
    }));
  }

  return customer;
};

export const removeIntegration = async (
  subdomain: string,
  models: IModels,
  integrationErxesApiId: string
): Promise<string> => {
  const integration = await models.Integrations.findOne({
    erxesApiId: integrationErxesApiId
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  let integrationRemoveBy;

  const { _id, kind, accountId, erxesApiId } = integration;

  const account = await models.Accounts.findOne({ _id: accountId });

  if (!account) {
    throw new Error('Account not found');
  }

  const selector = { integrationId: _id };

  if (kind.includes('whatsapp')) {
    debugWhatsapp('Removing entries');

    const whatsappNumberIds = integration.callCenterPhoneNumbers;

    if (!whatsappNumberIds) {
      throw new Error('whatsappNumber ID not found');
    }

    integrationRemoveBy = { whatsappNumberIds: integration.callCenterPhoneNumbers };

    const conversationIds =
      await models.Conversations.find(selector).distinct('_id');

    await models.Customers.deleteMany({ integrationId: integrationErxesApiId });
    await models.Conversations.deleteMany(selector);
    await models.ConversationMessages.deleteMany({
      conversationId: { $in: conversationIds }
    });

    await models.Integrations.deleteOne({ _id });
  }
  const ENDPOINT_URL = getEnv({ name: 'ENDPOINT_URL' });
  const DOMAIN = getEnv({ name: 'DOMAIN', subdomain });
  if (ENDPOINT_URL) {
    try {
      await fetch(`${ENDPOINT_URL}/remove-endpoint`, {
        method: 'POST',
        body: JSON.stringify({
          domain: DOMAIN,
          ...integrationRemoveBy
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      throw new Error(e.message);
    }
  }

  await models.Integrations.deleteOne({ _id });

  return erxesApiId;
};

export const removeAccount = async (
  subdomain,
  models: IModels,
  _id: string
): Promise<{ erxesApiIds: string | string[] } | Error> => {
  const account = await models.Accounts.findOne({ _id });

  if (!account) {
    return new Error(`Account not found: ${_id}`);
  }

  const erxesApiIds: string[] = [];

  const integrations = await models.Integrations.find({
    accountId: account._id
  });
  if (integrations.length > 0) {
    for (const integration of integrations) {
      try {
        const response = await removeIntegration(
          subdomain,
          models,
          integration.erxesApiId
        );
        erxesApiIds.push(response);
      } catch (e) {
        throw e;
      }
    }
  }

  await models.Accounts.deleteOne({ _id });

  return { erxesApiIds };
};

export const repairIntegrations = async (
  subdomain: string,
  models: IModels,
  integrationId: string
): Promise<true | Error> => {
  const integration = await models.Integrations.findOne({
    erxesApiId: integrationId
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  let number = integration.callCenterPhoneNumbers;

  if (!number) {
    throw new Error('Number not found');
  }

  try {
    await models.Integrations.deleteMany({
      erxesApiId: { $ne: integrationId },
      whatsappNumberIds: number,
      kind: integration.kind
    });
  } catch (e) {
    throw new Error(`Failed to delete integrations: ${e.message}`);
  }

  await models.Integrations.updateOne(
    { erxesApiId: integrationId },
    { $set: { healthStatus: 'healthy', error: '' } }
  );

  const ENDPOINT_URL = getEnv({ name: 'ENDPOINT_URL' });
  const DOMAIN = getEnv({ name: 'DOMAIN', subdomain });

  if (ENDPOINT_URL) {
    try {
      await fetch(`${ENDPOINT_URL}/update-endpoint`, {
        method: 'POST',
        body: JSON.stringify({
          domain: `${DOMAIN}/gateway/pl:whatsapp`,
          whatsappNumberIds: integration.callCenterPhoneNumbers
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      throw e;
    }
  }

  return true;
};

export const removeCustomers = async (models: IModels, params) => {
  const { customerIds } = params;
  const selector = { erxesApiId: { $in: customerIds } };

  await models.Customers.deleteMany(selector);
};

export const updateConfigs = async (
  models: IModels,
  configsMap
): Promise<void> => {
  await models.Configs.updateConfigs(configsMap);

  await resetConfigsCache();
};

export const routeErrorHandling = (fn, callback?: any) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (e) {
      if (callback) {
        return callback(res, e, next);
      }

      debugError(e.message);

      return next(e);
    }
  };
};

export const stringeeCreateIntegration = async (
  subdomain: string,
  models: IModels,
  { accountId, integrationId, data, kind }
): Promise<{ status: 'success' }> => {
  console.log("models: ", models, accountId, integrationId, data, kind )

  // const account = await models.Accounts.getAccount({ _id: accountId });

  const integration = await models.Integrations.create({
    kind,
    accountId,
    erxesApiId: integrationId,
    callCenterPhoneNumbers: JSON.parse(data).callCenterPhoneNumbers || [],
    memberIds: JSON.parse(data).memberIds || []
  });

  console.log("stringee_inte: ", integration)



  const ENDPOINT_URL = getEnv({ name: 'ENDPOINT_URL' });
  const DOMAIN = getEnv({ name: 'DOMAIN', subdomain });

  let domain = `${DOMAIN}/gateway/pl:whatsapp`;

  if (process.env.NODE_ENV !== 'production') {
    domain = `${DOMAIN}/pl:whatsapp`;
  }

  // if (ENDPOINT_URL) {
  //   try {
  //     await fetch(`${ENDPOINT_URL}/register-endpoint`, {
  //       method: 'POST',
  //       body: JSON.stringify({
  //         domain,
  //         whatsappNumberIds,
  //         wabaIds: whatsappNumberIds
  //       }),
  //       headers: { 'Content-Type': 'application/json' }
  //     });
  //   } catch (e) {
  //     await models.Integrations.deleteOne({ _id: integration._id });
  //     throw e;
  //   }
  // }

  const savedIntegration = await integration.save({validateBeforeSave: true});

  console.log("SAVED!!!!", savedIntegration )
  return { status: 'success' };
};

export function isPhoneNumber(phoneNumber: string) {
  return phoneNumber.startsWith('+') || phoneNumber.startsWith('0') || phoneNumber.startsWith('84');
}

export function removeCountryCodeFromPhoneNumber(phoneNumber: string) {
  phoneNumber = phoneNumber.replace('+', '').replace(' ', '');
  if (phoneNumber.startsWith('84')) {
    phoneNumber = phoneNumber.replace('84', '0');
  } 
  return phoneNumber;
}