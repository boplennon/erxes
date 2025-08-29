import { Emrs, Types } from "../../models";
import { IContext } from "@erxes/api-utils/src/types"

const emrQueries = {
  emrs(
    _root,
    {
      typeId
    },
    _context: IContext
  ) {

    const selector: any = {};

    if (typeId) {
      selector.typeId = typeId;
    }

    return Emrs.find(selector).sort({ order: 1, name: 1 });
  },

  emrTypes(_root, _args, _context: IContext) {
    return Types.find({});
  },

  emrsTotalCount(_root, _args, _context: IContext) {
    return Emrs.find({}).countDocuments();
  }
};

export default emrQueries;
