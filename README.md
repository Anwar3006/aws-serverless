# Fullstack App Using Lambda, API Gateway, DynamoDB, Cognito, React

## Create the DynamoDB table which will store our coffee data:

1.  Table name = `CoffeeShop`
2.  Partition key(Primary id) = `coffeeId` - string
3.  After creating table, select it go to Explore Items:
    1. Create items, to add more fields and value to the table, like: `name`, `price` and `available`. With this we have some default values in the table that we can query to see if the table is setup properly

## Create an IAM Role to be used by all the Lambda functions

We need to setup IAM Roles and assign them to our Lambda functions to give them permissions to access other AWS services like our Database especially DynamoDB

1. Go to IAM, select Roles:
2. Trusted entity type is `AWS service`
3. Service or use case is `Lambda`
4. For the Permission Policies choose the `AWSLambdaBasicExecutionRole` policy to allow our lambda functions access to CloudWatch Logs
5. Role name is `CoffeeShopRole`, Create Role.
6. Next we need to attach another policy to this role; one that allows the functions access to DynamoDB:
7. We create an inline policy and choose a Service of DynamoDB. For the actions allows we scan for these: `Scan`, `GetItem`, `PutItem`, `DeleteItem` and `UpdateItem`
8. Now in the Resources tab, we need to add the DynamoDB table's ARN to restrict access to only this table. Go to DynamoDB, click on the table, copy the ARN(eg: `arn:aws:dynamodb:us-east-1:<accountID>:table/CoffeeShop`). Come back, click on add arn and paste this in the Resource ARN input field
9. For Policy name we choose `DynamoDB-Policy`

## Create Lamdba Function

1. Function name is `getCoffee`
2. Runtime is `Node.js.22.x`
3. Architecture we chose was `arm64`
4. Permission, use an existing role and choose `CoffeeShopRole` and create the function
5. We will work locally and upload the files to Lambda function code editor since we need to install and use SDKs to be able to work with DynamoDb and other services and installing dependencies is not available on the Lambda Function code editor

### Local Development of the getItems Lambda function

1. Navigate to this documentation [GetItem](https://docs.aws.amazon.com/code-library/latest/ug/dynamodb_example_dynamodb_GetItem_section.html)
2. Choose Javascript, copy the code. Youll need to `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`
3. Change:

```js
{
    import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
//why do we need two libraries? the client-dynamodb is low-level and the lib-dynamodb is high-level.

    main //change the function name from main to getCoffee, inside Lambda dashboard we will change from index.handler to index.getCoffee else our function wont work there
    TableName: "AngryAnimals", //change to the table name you created, "CoffeeShop"
    Key: {
      CommonName: "Shoebill", //change CommonName to coffeeId, the Partition Key, and Shoebill to any coffeeId value, we have only one record in our table currently we coffeeId being c101, so use c101
    },
  }
```

4. The above are hardcoded so we can test our Lambda function connects to and queries our database.
5. We have this lambda function in this folder structure: "./lambda/get". We install the dependencies and have the index.mjs file within this get folder. This is because we will compress this get folder into a zip file and upload it to the Lambda Function VS code

```bash
# zip -r name_of_file.zip file/s_to_zip
zip -r get.zip ./*
```

6. Upload the zip file, go to Run Time Settings and click Edit, change the Handler from index.handler to index.getCoffee
7. Test the function.
8. Now we are ready for the actual implementation of the getCoffee function: `createResponse` is a simple function to take a statusCode and the response from running the command and return an object. `getCoffee` function relies on two commands from the lib-dynamodb library, `GetCommand` which gets only one record from the table and `ScanCommand` which returns every record from the table.

```js
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
```

9. We create the Lambda function for the `createCoffee` function following the steps above. The function name is `createCoffee` and don't forget to change the Runtime handler to `index.createCoffee`
10. Create a folder called `create` in our local directory, same level as the previous get folder, within it we `npm init -y` to initialize a new project and and `index.mjs` file to contain our function, same as before. The documentation we need is [PutItem](https://docs.aws.amazon.com/code-library/latest/ug/dynamodb_example_dynamodb_PutItem_section.html)
11. We create a Lambda function for the `updateCoffee` function following the usual steps. Then locally we install the libraries needed.
12. Create the route `/coffees/{id}` and the integration also.
13. Next we create a Lambda function for the `deleteCoffee` following the usual steps. Then a route and an integration
14. Realize that for all 4 functions we are installing and maintaining libraries for each. This is not optimal, we can leverage Lambda Layers to create Shared Dependencies and libraries in a layer instead of bundling them with each function. This approach can also allow us to sahre common code amongst the individual functions.

### Lambda with Layers

1. In your local directory, create a folder called `lambdaWithLayer` within it create 2 folders, `lambda` to hold all our lambda functions and `nodejs` to hold our dependencies.
2. Initialize a new node project with `npm init -y`
3. Create a file called utils.mjs, this file will contain common, reusable blocks of code.

```js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
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

export {
  docClient,
  createResponse,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  PutCommand,
  DeleteCommand,
};
```

4. Now we can easily create lambda functions. Go to `lambda` folder, create a folder for the http method, eg, get, post, update, delete. Within it, create an `index.mjs` file.

```js
import {
  docClient,
  GetCommand,
  ScanCommand,
  createResponse,
} from "../nodejs/utils.mjs";
const tableName = process.env.tableName || "CoffeeShop";

export const getCoffee = async (event) => {
  //...continue as normal
};
```

5. After creating all the folders and files within them and defining the corresponding lambda functions. We create a bash script inside the root of `lambdaWithLayer` at the same level as the `lambda` folder and `nodejs` folder.

```sh
# create_zip.sh
echo "Creating zip for nodejs folder -> renaming to layer"
zip -r layer.zip nodejs

echo "Creating zip for GET Function"
cd lambdaWithLayer/get
zip -r get.zip index.mjs
mv get.zip ../../
cd ../..

echo "Creating zip for POST Function"
cd lambdaWithLayer/post
zip -r post.zip index.mjs
mv post.zip ../../
cd ../..

echo "Creating zip for UPDATE Function"
cd lambdaWithLayer/update
zip -r update.zip index.mjs
mv update.zip ../../
cd ../..

echo "Creating zip for DELETE Function"
cd lambdaWithLayer/delete
zip -r delete.zip index.mjs
mv delete.zip ../../
cd ../..

echo "Success ✅✅✅✅"
```

6. Then on the Lambda dashboard, we will locate Layers, on the sidebar and click it, the aim is to create a Layer so click Create layer. The name of the layer is CoffeeShopAppLayer. Check Upload a zip and choose the layer.zip file, which is supposed to be a compressed file containing the the app dependencies and shared, reusable code blocks. You can choose any of the options for Compatible architectures. For Compatible runtimes, choose latest version of Node.js. Then create.
7. Next we create/update the Lambda functions to reflect the changes made locally. If we havent created any Lambda functions, we create them and upload their corresponding zip files, if we have created them, we still need to upload the zip files for each of them since we made changes to import from our layers folder instead of the direct imports.
8. After that click on Layers, which is located beneath the function name in the Function overview plane. You will be directed to the Layers section, click on Add Layer, Select Custom Layer, and choose the layer we created before in the Custom Layers dropdown, for Version choose 1, since we have only one version, Then click Add.

## Create API Gateway

1. Navigate to the API Gateway service page as we want to create one and connect it to the Lambda functions.
2. We create an HTTP API Gateway, name is `CoffeeShop` that is the only we will set-up for now, so choose Next for all and finally Create.
3. Create a route now. We will create a get `/coffees` route to get all coffees and a get `/coffees/{id}` to get one coffee by id.
4. For the two routes created, we need to create an Integration. Locate Integrations in the side-bar on your left and click it and click the Manage integrations tab.
   a. Click on Create
   b. Attach this integration to a route: `/coffees`. Integration target is Lambda function
   c. In the Integration details box, select the Lambda function you created in the Lambda function dropdown.
   d. `Grant API Gateway permission to invoke your Lambda function`, if this is disabled, enable it
5. When we navigate to the url and append `/coffees`, we will get the records from our DynamoDB. Meaning our API Gateway is successfully invoking our Lambda function which queries our DynamoDB for records.
   a. This is how the API url might look like `https://55onlqoeda.execute-api.us-east-1.amazonaws.com` then you append `/coffees`
6. We have attached integration for the `coffees` route, we need to repeat the steps for the `/coffees/{id}` route
7. We now create a route `/coffees` with method POST for the Create Lambda function and create an Integration for it also.
8. After creating we get the API url and test with postman so see if we can indeed create new records

```json
{
  "coffeeId": "c101",
  "name": "User's Coffee Beans",
  "price": 50,
  "available": true
}
```

9. Repeat creating a route `/coffees/{id}` and an integration for the Update Lambda function.

## Frontend with React

1. Now let us set up our React frontend to talk to the API Gateway
2. Locally, we create a folder `frontend` at the same level as `lambda` or `lambdaWithLayer`, which ever appraoch you used.
3. Initialize a new React-vite app with `npm create vite@latest .`, choose React, choose Javascript. Then install `npm i react-router-dom`.
4. Create a `.env` file with content similar to the [.env.example](./frontend/.env.example)
5. Create your main.jsx

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ItemDetails from "./ItemDetails.jsx";

createRoot(document.getElementById("root")).render(
  <Router>
    <div>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/details/:id" element={<ItemDetails />} />
      </Routes>
    </div>
  </Router>
);
```

6. Create the ItemDetails.jsx component

```jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCoffee, updateCoffee, deleteCoffee } from "./utils/apis";
import reactImg from "./assets/react.svg";

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coffee, setCoffee] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    getCoffee(id).then((data) => setCoffee(data.Item));
  }, [id]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleUpdate = () => {
    updateCoffee(id, coffee).then(() => toggleEditMode());
  };

  const handleDelete = () => {
    deleteCoffee(id).then(() => navigate("/"));
  };

  if (!coffee) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1>{editMode ? "Edit Coffee" : coffee.name}</h1>
      {editMode ? (
        <>
          <input
            className="styled-input"
            value={coffee.coffeeId}
            onChange={(e) => setCoffee({ ...coffee, coffeeId: e.target.value })}
          />
          <input
            className="styled-input"
            value={coffee.name}
            onChange={(e) => setCoffee({ ...coffee, name: e.target.value })}
          />
          <input
            className="styled-input"
            type="number"
            value={coffee.price}
            onChange={(e) =>
              setCoffee({ ...coffee, price: Number(e.target.value) })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={coffee.available}
              onChange={(e) =>
                setCoffee({ ...coffee, available: e.target.checked })
              }
            />{" "}
            Available
          </label>
        </>
      ) : (
        <>
          <img src={reactImg} alt="coffee" />
          <p>Price: ${coffee.price}</p>
          <p>{coffee.available ? "Available" : "Not Available"}</p>
        </>
      )}
      <button onClick={editMode ? handleUpdate : toggleEditMode}>
        {editMode ? "Save" : "Edit"}
      </button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

export default ItemDetails;
```

7. Get the frontend fron this [repo](https://github.com/TrickSumo/AWS-CRUD-Serverless/blob/main/frontend)
8. In order for our frontend to communicate with our backend, we need to enable CORS for the API Gateway.

## Configure Cognito to protect the API Routes

1. Cognito, User pools, Create User pool, then select Single-Page Application.
2. Name of application is CoffeeShopClient, Required attribute for sign-in is email, the same attribute for sign-up. Return url is the homepage of your application.
3. Go back to API Gateway, we will create an Authorization. JWT as the Authorizer type. Name is Cognito-CoffeeShop. The issue url is the Token signing key url from the Cognito dashboard, paste it and remove the `/.well..`. For the Audience, go to Cognito App client, locate the CoffeeShopClient and copy the Client ID
4. Now go to each route and attach this new authorization. What we will observe is that now when we navigate to any route, we will get Unauthorized because now the routes expect a header that has a JWT attached to it
5. Next we need to integrate Cognito with our Frontend too, we have only setup Cognito for the routes and have protected them, we need to get the frontend to pass the needed data with it's requests so they arent rejected
6. We go back to Cognito, to the Quick set-up guide and follow the instructions.
7. We need to update the apis because our current api dont have the token in the headers. We need to get the token given to us by Cognito from the browser storage and put them in every request to avoid a 401 error.

## Host Frontend in an S3 Bucket

1. Create a bucket with name `coffeeshop-frontend-2025`, keep everything default including blocking all public access, we will hosta nd expose the bucket on Cloudfront CDN.

## CloudFront setup for the frontend

1. We will create a Distribution. We select the S3 bucket we just created.
2. After setting up we need to update the Cognito settings to use the distribution domain name instead of the http://localhost:5173. Go to the Cognito -> Select the user User pool -> in the sidebar, select App Clients and select the appropriate one -> Select the Login pages -> Click Edit -> Add another url for both the sign-in and sign-out. Eg: `https://d22ps7hs0x7by9.cloudfront.net` -> Save changes
3. Locally, we also need to change the redirect_uri, logoutUri, or any of the uri from localhost to `https://d22ps7hs0x7by9.cloudfront.net`
4. Now we can upload the frontend. Run `npm run build` to build the files, go to S3 and upload the `/dist` folder
5. For the Distribution, we need to edit and set the Default root object to index.html
6. Now we configure CORS in our API Gateway to allow the url of the CloudFront CDN.
7. So our Bucket is private and CloudFront is just exposing this bucket, which hosts our frontend files, to the internet
8. We have an origin that is connected to our S3 bucket to serve frontend files, we can also create another origin to connect to our API Gateway that way both of them are exposed through the CloudFront CDN
9. In Cloudfront, in the Distribution we created, click on origins tab and then create orgin button. In the origin domain input, select the right service under the API Gateway, then leave everythin as they are and click create origin.
10. Next we need to configure Behavior for the API Gateway, right next to the Origins tab, click on Behaviors. There is a Default behavior which is pointing to the S3 bucket. We will create one for the API Gateway. Click on create behavior, for pattern, we want all requests with routes that match this pattern `/coffees*` to be routed to our API Gatway, select the API Gateway then create it.
11. Now we can go locally and update our `VITE_API_URL` to the Cloudfront url. The idea is that we expose the API Gateway through the CDN for advantages like Global caching for our GET requests and protection from DDoS attacks. Rebuild the files and upload to S3.
