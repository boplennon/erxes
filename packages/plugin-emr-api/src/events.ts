

import {
    sendCoreMessage
  } from "./messageBroker";
  
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