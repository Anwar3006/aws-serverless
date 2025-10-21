import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

export const updateCoffee = async (event) => {
  const { body, pathParameters } = event;
  const { id } = pathParameters || {};
  const { name, price, available } = JSON.parse(body || "{}");

  if (!id) {
    return createResponse(400, { error: "Missing required Id field" });
  }

  if (!name || !price || available === undefined) {
    return createResponse(400, { error: "Missing required fields in body" });
  }

  let updateExpress = `set ${name ? "#name = :name, " : ""}${
    price ? "price = :price, " : ""
  }${available ? "available = :available, " : ""}`.slice(0, -2);

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      coffeeId: id,
    },
    UpdateExpression: updateExpress,
    ...(name && { ExpressionAttributeNames: { "#name": "name" } }),
    ExpressionAttributeValues: {
      ...(name && { ":name": name }),
      ...(price && { ":price": price }),
      ...(available && { ":available": available }),
    },
    ReturnValues: "ALL_NEW", // Return the updated item as response
    ConditionExpression: "attribute_exists(coffeeId)", // Ensure item exists before updating
  });

  try {
    const response = await docClient.send(command);
    return createResponse(200, {
      message: "Item updated successfully",
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
