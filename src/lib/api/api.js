import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    [import.meta.env.VITE_SUBSCRIPTION_KEY_HEADER]: [
      import.meta.env.VITE_ENV_NAME === "production"
        ? import.meta.env.VITE_SUBSCRIPTION_KEY_VALUE_PROD
        : import.meta.env.VITE_SUBSCRIPTION_KEY_VALUE,
    ],
  },
});
export default API;
