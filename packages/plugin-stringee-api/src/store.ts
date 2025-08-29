import { sendInboxMessage } from './messageBroker';
import { IModels } from './connectionResolver';
import { IIntegrationDocument } from './models/Integrations';

export const getOrCreateCustomer = async (
  models: IModels,
  subdomain: string,
  phone: any,
  integration: IIntegrationDocument
) => {
  console.log("getOrCreateCustomer:", phone)
  let customer = await models.Customers.findOne({ phoneNumber: phone });
  console.log("custome doner: ", customer)
  if (customer) {
    return customer;
  }

  try {
    customer = await models.Customers.create({
      phoneNumber: phone,
      integrationId: integration._id,
      firstName: phone,
      isUser: true
    });
  } catch (e) {
    console.log("ERROR -->", e)
    throw new Error(
      e.message.includes('duplicate')
        ? 'Concurrent request: customer duplication'
        : e
    );
  }
  try {
    const apiCustomerResponse = await sendInboxMessage({
      subdomain,
      action: 'integrations.receive',
      data: {
        action: 'get-create-update-customer',
        payload: JSON.stringify({
          integrationId: integration.erxesApiId,
          primaryPhone: phone,
          isUser: true
        })
      },
      isRPC: true
    });

    customer.erxesApiId = apiCustomerResponse._id;
    await customer.save();
  } catch (e) {
    await models.Customers.deleteOne({ _id: customer._id });
    throw new Error(e);
  }
  return customer;
};

export const customerCreated = async (
  userId: string,
  firstName: string,
  integrationId: any,
  profilePic: any,
  subdomain: any,
  models: IModels,
  customer: any,
  integration: any
) => {
  try {
    customer = await models.Customers.create({
      userId,
      firstName: firstName,
      integrationId: integrationId,
      profilePic: profilePic
    });
  } catch (e) {
    throw new Error(
      e.message.includes('duplicate')
        ? 'Concurrent request: customer duplication'
        : e.message
    );
  }
  try {
    const apiCustomerResponse = await sendInboxMessage({
      subdomain,
      action: 'integrations.receive',
      data: {
        action: 'get-create-update-customer',
        payload: JSON.stringify({
          integrationId: integration.erxesApiId,
          firstName: firstName,
          avatar: profilePic,
          isUser: true
        })
      },
      isRPC: true
    });
    customer.erxesApiId = apiCustomerResponse._id;
    await customer.save();
  } catch (e) {
    await models.Customers.deleteOne({ _id: customer._id });
    throw new Error(e.message);
  }
};
