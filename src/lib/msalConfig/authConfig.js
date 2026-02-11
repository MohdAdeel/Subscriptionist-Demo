import { LogLevel } from "@azure/msal-browser";

const isProd = import.meta.env.VITE_ENV_NAME === "production";

export const msalConfig = {
  auth: {
    clientId: "de6c47fe-291e-4135-b56c-0b1e2a58899f",
    // isProd
    //   ? import.meta.env.VITE_LOGIN_CLIENT_ID
    //   : import.meta.env.VITE_LOGIN_CLIENT_ID_DEV,
    authority:
      "https://subscriptionistportal.b2clogin.com/subscriptionistportal.onmicrosoft.com/B2C_1_SignIn/v2.0",
    knownAuthorities: ["subscriptionistportal.b2clogin.com"],
    //import.meta.env.VITE_LOGIN_AUTHORITY_SUB_DOMAIN,
    redirectUri: "http://localhost:5173/",
    // isProd
    //   ? import.meta.env.VITE_LOGIN_REDIRECT_URI
    //   : import.meta.env.VITE_LOGIN_REDIRECT_URI_DEV,
    postLogoutRedirectUri: "http://localhost:5173/login",
    // isProd
    //   ? import.meta.env.VITE_LOGIN_POST_LOGOUT_REDIRECT_URI
    //   : import.meta.env.VITE_LOGIN_POST_LOGOUT_REDIRECT_URI_DEV,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          default:
            break;
        }
      },
    },
  },
};

// export const loginRequest = {
//   scopes: [isProd ? import.meta.env.VITE_LOGIN_REQUEST : import.meta.env.VITE_LOGIN_REQUEST_DEV],
// };

export const loginRequest = {
  scopes: ["openid", "profile", "offline_access"],
};
