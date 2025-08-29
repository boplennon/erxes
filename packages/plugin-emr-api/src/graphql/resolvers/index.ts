import customScalars from '@erxes/api-utils/src/customScalars';

import mutations from './mutations';
import queries from './queries';
import { Types } from '../../models';
import { sendCoreMessage } from '../../messageBroker';
import { IContext as IMainContext } from "@erxes/api-utils/src";

interface IContext extends IMainContext {
  subdomain: string;
  models: any;
  serverTiming: any;
}


const Emr = {
  currentType(emr, _args) {
    return Types.findOne({ _id: emr.typeId });
  },
  async activeCustomers(_, { }, { subdomain }: IContext) {
    const customers = await sendCoreMessage({
      subdomain,
      action: 'customers.findActiveCustomers',
      data: {
        selectors: {
          email: { $eq: 'blue.lennon@gmail.com' },
        },
        limit: 10
      },
      isRPC: true,
      defaultValue: []
    })

    if (!customers.length) {
      return null
    }

    return customers
  }
};

const resolvers: any = async () => ({
  ...customScalars,
  Emr,
  Mutation: {
    ...mutations
  },
  Query: {
    ...queries
  }
});

export default resolvers;
