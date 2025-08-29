const list = `
  query listQuery($typeId: String) {
    emrs(typeId: $typeId) {
      _id
      name
      expiryDate
      createdAt
      checked
      typeId
      currentType{
        _id
        name
      }
    }
  }
`;

const listEmrTypes = `
  query listEmrTypeQuery{
    emrTypes{
      _id
      name
    }
  }
`;

const totalCount = `
  query emrsTotalCount{
    emrsTotalCount
  }
`;

export default {
  list,
  totalCount,
  listEmrTypes
};
