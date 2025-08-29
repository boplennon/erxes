import { Emrs, Types } from '../../models';
import { IContext } from "@erxes/api-utils/src/types"

const emrMutations = {
  /**
   * Creates a new emr
   */
  async emrsAdd(_root, doc, _context: IContext) {
    return Emrs.createEmr(doc);
  },
  /**
   * Edits a new emr
   */
  async emrsEdit(
    _root,
    { _id, ...doc },
    _context: IContext
  ) {
    return Emrs.updateEmr(_id, doc);
  },
  /**
   * Removes a single emr
   */
  async emrsRemove(_root, { _id }, _context: IContext) {
    return Emrs.removeEmr(_id);
  },

  /**
   * Creates a new type for emr
   */
  async emrTypesAdd(_root, doc, _context: IContext) {
    return Types.createType(doc);
  },

  async emrTypesRemove(_root, { _id }, _context: IContext) {
    return Types.removeType(_id);
  },

  async emrTypesEdit(
    _root,
    { _id, ...doc },
    _context: IContext
  ) {
  return Types.updateType(_id, doc);
  }
};

export default emrMutations;
