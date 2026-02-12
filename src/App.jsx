import "./App.css";
import AppRoutes from "./routes/AppRoutes";
import { useMsal } from "@azure/msal-react";
import React, { useEffect, useRef } from "react";
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

  // Deduplicate: only fetch once per account (avoids 3x calls from Strict Mode + useMsal re-renders)
  const lastFetchedB2CIdRef = useRef(null);

  useEffect(() => {
    const account = instance.getAllAccounts()[0];
    if (account) {
      const b2cObjectId = account.localAccountId;
      if (lastFetchedB2CIdRef.current === b2cObjectId) {
        return; // already fetched for this account this session
      }
      lastFetchedB2CIdRef.current = b2cObjectId;
      setAccountDetailsAzureResponse(account);
      setUserAuthLoading(true);
      const minDelayMs = 400; // Show skeleton at least this long so it's visible
      Promise.all([
        getContactByB2CObjectId(b2cObjectId),
        new Promise((r) => setTimeout(r, minDelayMs)),
      ])
        .then(([response]) => {
          setUserAuth(response);
        })
        .catch(() => {
          lastFetchedB2CIdRef.current = null; // allow retry on error
        })
        .finally(() => {
          setUserAuthLoading(false);
        });
    } else {
      lastFetchedB2CIdRef.current = null;
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
