import { Document, Model, Schema } from 'mongoose';

import { IModels } from '../connectionResolver';
import { field } from './definitions/utils';

export interface IIntegration {
  kind: string;
  accountId: string;
  erxesApiId: string;
  callCenterPhoneNumbers: string[];
  error: string;
}

export interface IIntegrationDocument extends IIntegration, Document {}

export const integrationSchema = new Schema({
  _id: field({ pkey: true }),
  kind: String,
  accountId: String,
  erxesApiId: String,
  emailScope: String,
  callCenterPhoneNumbers: field({
    type: [String],
    label: 'callCenterPhoneNumbers',
    optional: false
  }),
  memberIds: field({
    type: [String],
    label: 'memberIds',
    optional: false
  }),
});

export interface IIntegrationModel extends Model<IIntegrationDocument> {
  getIntegration(selector): Promise<IIntegrationDocument>;
}

export const loadIntegrationClass = (models: IModels) => {

  class Integration {
    public static async getIntegration(selector) {
      const integration = await models.Integrations.findOne();
      if (!integration) {
        throw new Error('Stringee Integration not found ');
      }

      return integration;
    }
  }

  integrationSchema.loadClass(Integration);

  return integrationSchema;
};
