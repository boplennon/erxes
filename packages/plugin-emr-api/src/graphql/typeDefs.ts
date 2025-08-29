import gql from 'graphql-tag';

const types = `
  type Emr {
    _id: String!
    name: String
    createdAt:Date
    expiryDate:Date
    checked:Boolean
    typeId: String
  
    currentType: EmrType
  }

  type EmrType {
    _id: String!
    name: String
  }
`;

const queries = `
  emrs(typeId: String): [Emr]
  emrTypes: [EmrType]
  emrsTotalCount: Int
`;

const params = `
  name: String,
  expiryDate: Date,
  checked: Boolean,
  typeId:String
`;

const mutations = `
  emrsAdd(${params}): Emr
  emrsRemove(_id: String!): JSON
  emrsEdit(_id:String!, ${params}): Emr
  emrTypesAdd(name:String):EmrType
  emrTypesRemove(_id: String!):JSON
  emrTypesEdit(_id: String!, name:String): EmrType
`;


const typeDefs = async () => {
  return gql`
    scalar JSON
    scalar Date

    ${types}
    
    extend type Query {
      ${queries}
    }
    
    extend type Mutation {
      ${mutations}
    }
  `;
};

export default typeDefs;
