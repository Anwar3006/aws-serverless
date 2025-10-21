import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

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

export const deleteCoffee = async (event) => {
  const { pathParameters } = event;
  const { id } = pathParameters || {};

  if (!id) {
    return createResponse(400, { error: "Missing required Id field" });
  }

  const command = new DeleteCommand({
    TableName: tableName,
    Key: {
      coffeeId: id,
    },
    ReturnValues: "ALL_OLD", // Return the deleted item
    ConditionExpression: "attribute_exists(coffeeId)", // Ensure item exists before deleting
  });

  try {
    const response = await docClient.send(command);
    return createResponse(200, {
      message: "Item deleted successfully",
      response,
    });
  } catch (error) {
    console.error("Error updating item in DynamoDB:", error);
    if (error.name === "ConditionalCheckFailedException") {
      return createResponse(404, { error: "Item not found" });
    }
    return createResponse(500, { error: error.message });
  }
};
