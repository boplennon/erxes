const add = `
  mutation emrsAdd($name: String!, $expiryDate: Date, $typeId:String) {
    emrsAdd(name:$name, expiryDate: $expiryDate, typeId:$typeId) {
      name
      _id
      expiryDate
      typeId
    }
  }
`;

const remove = `
  mutation emrsRemove($_id: String!){
    emrsRemove(_id: $_id)
  }
  `;

const edit = `
  mutation emrsEdit($_id: String!, $name:String, $expiryDate:Date, $checked:Boolean, $typeId:String){
    emrsEdit(_id: $_id, name: $name, expiryDate:$expiryDate, checked:$checked, typeId:$typeId){
      _id
    }
  }
  `;

const addType = `
  mutation typesAdd($name: String!){
    emrTypesAdd(name:$name){
      name
      _id
    }
  }
  `;

const removeType = `
  mutation typesRemove($_id:String!){
    emrTypesRemove(_id:$_id)
  }
`;

const editType = `
  mutation typesEdit($_id: String!, $name:String){
    emrTypesEdit(_id: $_id, name: $name){
      _id
    }
  }
`;

export default {
  add,
  remove,
  edit,
  addType,
  removeType,
  editType
};
