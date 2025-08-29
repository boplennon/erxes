import * as _ from 'underscore';
import { model } from 'mongoose';
import { Schema } from 'mongoose';

export const typeSchema = new Schema({
  name: String
});

export const emrSchema = new Schema({
  name: String,
  createdAt: Date,
  expiryDate: Date,
  checked: Boolean,
  typeId: String
});

export const loadTypeClass = () => {
  class Type {
    public static async getType(_id: string) {
      const type = await Types.findOne({ _id });

      if (!type) {
        throw new Error('Type not found');
      }

      return type;
    }
    // create type
    public static async createType(doc) {
      return Types.create({ ...doc });
    }
    // remove type
    public static async removeType(_id: string) {
      return Types.deleteOne({ _id });
    }

    public static async updateType(_id: string, doc) {
      return Types.updateOne({ _id }, { $set: { ...doc } });
    }
  }

  typeSchema.loadClass(Type);
  return typeSchema;
};

export const loadEmrClass = () => {
  class Emr {
    public static async getEmr(_id: string) {
      const emr = await Emrs.findOne({ _id });

      if (!emr) {
        throw new Error('Emr not found');
      }

      return emr;
    }

    // create
    public static async createEmr(doc) {
      return Emrs.create({
        ...doc,
        createdAt: new Date()
      });
    }
    // update
    public static async updateEmr (_id: string, doc) {
      await Emrs.updateOne(
        { _id },
        { $set: { ...doc } }
      ).then(err => console.error(err));
    }
    // remove
    public static async removeEmr(_id: string) {
      return Emrs.deleteOne({ _id });
    }
  }

emrSchema.loadClass(Emr);

return emrSchema;
};

loadEmrClass();
loadTypeClass();

// tslint:disable-next-line
export const Types = model<any, any>(
  'emr_types',
  typeSchema
);

// tslint:disable-next-line
export const Emrs = model<any, any>('emrs', emrSchema);
