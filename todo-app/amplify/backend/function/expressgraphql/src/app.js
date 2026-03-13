const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express4');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand,
  ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const serverless = require('serverless-http');

const app = express();
app.use(cors());
app.use(express.json());

const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.STORAGE_TODOTABLE_NAME;

// GraphQL schema definition
const typeDefs = `#graphql
type Todo { id: ID! name: String!
description: String completed: Boolean! }
type Query { getTodos: [Todo] }
type Mutation {
addTodo(name: String!, description: String): Todo
toggleTodo(id: ID!): Todo }`;

// Resolvers — functions that fetch or modify data
const resolvers = {
  Query: {
    getTodos: async () => {
      const result = await docClient.send(
        new ScanCommand({ TableName: TABLE_NAME }));
      return result.Items || [];
    },
  },
  Mutation: {
    addTodo: async (_, { name, description }) => {
      const newTodo = {
        id: randomUUID(), name,
        description, completed: false
      };
      await docClient.send(new PutCommand(
        { TableName: TABLE_NAME, Item: newTodo }));
      return newTodo;
    },
    toggleTodo: async (_, { id }) => {
      const result = await docClient.send(new UpdateCommand({
        TableName: TABLE_NAME, Key: { id },
        UpdateExpression: 'SET completed = :c',
        ExpressionAttributeValues: { ':c': true },
        ReturnValues: 'ALL_NEW'
      }));
      return result.Attributes;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

let handler;
module.exports.handler = async (event, context) => {
  if (!handler) {
    await server.start();
    app.use('/graphql', expressMiddleware(server));
    handler = serverless(app);
  }
  return handler(event, context);
};