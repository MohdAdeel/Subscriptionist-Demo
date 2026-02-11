import "./App.css";
import React, { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useMsal } from "@azure/msal-react";
import { useAuthStore } from "./stores/authStore";
import { getContactByB2CObjectId } from "./lib/api/getAccount/getAccount";

function AuthSync() {
  const { instance, accounts } = useMsal();
  const setAccountDetailsAzureResponse = useAuthStore(
    (state) => state.setAccountDetailsAzureResponse
  );
  const setUserAuth = useAuthStore((state) => state.setUserAuth);
  const setUserAuthLoading = useAuthStore((state) => state.setUserAuthLoading);
  const clearAccountDetailsAzureResponse = useAuthStore(
    (state) => state.clearAccountDetailsAzureResponse
  );
  const clearUserAuth = useAuthStore((state) => state.clearUserAuth);

  useEffect(() => {
    const account = instance.getAllAccounts()[0];
    if (account) {
      setAccountDetailsAzureResponse(account);
      setUserAuthLoading(true);
      const b2cObjectId = account.localAccountId;
      const minDelayMs = 400; // Show skeleton at least this long so it's visible
      Promise.all([
        getContactByB2CObjectId(b2cObjectId),
        new Promise((r) => setTimeout(r, minDelayMs)),
      ])
        .then(([response]) => {
          setUserAuth(response);
        })
        .finally(() => {
          setUserAuthLoading(false);
        });
    } else {
      setUserAuthLoading(false);
      clearAccountDetailsAzureResponse();
      clearUserAuth();
    }
  }, [
    instance,
    accounts.length,
    setAccountDetailsAzureResponse,
    setUserAuth,
    setUserAuthLoading,
    clearAccountDetailsAzureResponse,
    clearUserAuth,
  ]);

  return null;
}

function App() {
  return (
    <>
      <AuthSync />
      <AppRoutes />
    </>
  );
}

export default App;
