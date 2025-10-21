const API_BASE_URL = import.meta.env.VITE_API_URL;

// export const fetchCoffees = async () => {
//   // alert(`API_BASE_URL: ${API_BASE_URL}`)
//   const response = await fetch(`${API_BASE_URL}/coffees`);
//   return response.json();
// };

// export const getCoffee = async (id) => {
//   const response = await fetch(`${API_BASE_URL}/coffees/${id}`);
//   return response.json();
// };

// export const createCoffee = async (coffee) => {
//   const response = await fetch(`${API_BASE_URL}/coffees`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(coffee),
//   });
//   return response.json();
// };

// export const updateCoffee = async (id, coffee) => {
//   const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(coffee),
//   });
//   return response.json();
// };

// export const deleteCoffee = async (id) => {
//   const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
//     method: "DELETE",
//   });
//   return response.json();
// };

const getAccessToken = () => {
  const sessionStoragKeys = Object.keys(sessionStorage);
  const oidcKey = sessionStoragKeys.find((key) =>
    key.startsWith("oidc.user:https://cognito-idp.")
  );
  const oidcContext = JSON.parse(sessionStorage.getItem(oidcKey) || "{}");
  const accessToken = oidcContext?.access_token;
  return accessToken;
};

export const deleteAccessToken = () => {
  const sessionStoragKeys = Object.keys(sessionStorage);
  const oidcKey = sessionStoragKeys.find((key) =>
    key.startsWith("oidc.user:https://cognito-idp.")
  );
  sessionStorage.removeItem(oidcKey);
};

export const fetchCoffees = async () => {
  // alert(`API_BASE_URL: ${API_BASE_URL}`)
  const response = await fetch(`${API_BASE_URL}/coffees`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });
  return response.json();
};

export const getCoffee = async (id) => {
  const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });
  return response.json();
};

export const createCoffee = async (coffee) => {
  const response = await fetch(`${API_BASE_URL}/coffees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(coffee),
  });
  return response.json();
};

export const updateCoffee = async (id, coffee) => {
  const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(coffee),
  });
  return response.json();
};

export const deleteCoffee = async (id) => {
  const response = await fetch(`${API_BASE_URL}/coffees/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
  });
  return response.json();
};
