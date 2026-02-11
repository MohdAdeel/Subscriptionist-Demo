// import { loginRequest } from "./authConfig";
// import { msalInstance } from "./msalInstance";

// export async function getAccessToken() {
//   const accounts = msalInstance.getAllAccounts();
//   if (accounts.length === 0) {
//     await msalInstance.loginPopup(loginRequest);
//   }
//
//   const result = await msalInstance.acquireTokenSilent({
//     scopes: loginRequest.scopes,
//     account: msalInstance.getAllAccounts()[0],
//   });
//
//   return result.accessToken;
// }
