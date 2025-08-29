const removeAccount = `
  mutation stringeeAccountRemove($_id: String!) {
    stringeeAccountRemove(_id: $_id)
  }
`;


export default {
  removeAccount
};