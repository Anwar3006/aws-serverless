import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

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

export const createCoffee = async (event) => {
  const { body } = event;
  const { coffeeId, name, price, available } = JSON.parse(body || "{}");

  if (!coffeeId || !name || !price || available === undefined) {
    return createResponse(400, { error: "Missing required fields" });
  }

  const command = new PutCommand({
    TableName: tableName,
    Item: {
      coffeeId,
      name,
      price,
      available,
    },
    ConditionExpression: "attribute_not_exists(coffeeId)",
  });

  try {
    const response = await docClient.send(command);
    return createResponse(201, {
      message: "Item created successfully",
      response,
    });
  } catch (error) {
    console.error("Error creating item in DynamoDB:", error);
    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(409, {
        error: "Item with the same coffeeId already exists",
      });
    }
    return createResponse(500, { error: error.message });
  }
};
