import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";

import App from "./App.jsx";
import ItemDetails from "./ItemDetails.jsx";
import Home from "./Home.jsx";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_zpGytvroS",
  client_id: "117eeu1komi6jq014r55pv65vm",
  redirect_uri: "https://d22ps7hs0x7by9.cloudfront.net",
  response_type: "code",
  scope: "email openid phone",
};

createRoot(document.getElementById("root")).render(
  <AuthProvider {...cognitoAuthConfig}>
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/details/:id" element={<ItemDetails />} />
        </Routes>
      </div>
    </Router>
  </AuthProvider>
);
