import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "CoffeeShop";

const createResponse = (statusCode, body) => {
  const responseBody = body ? JSON.stringify(body) : "";
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: responseBody,
  };
};

export const getCoffee = async (event) => {
  const { pathParameters } = event;
  const { id } = pathParameters || {};

  try {
    let command;
    if (id) {
      command = new GetCommand({
        TableName: tableName,
        Key: {
          coffeeId: id,
        },
      });
    } else {
      command = new ScanCommand({
        TableName: tableName,
      });
    }

    const response = await docClient.send(command);
    return createResponse(200, response);
  } catch (error) {
    console.error("Error fetching item from DynamoDB:", error);
    return createResponse(500, { error: error.message });
  }
};
