import "./index.css";
import App from "./App.jsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PopupProvider } from "./components/Popup";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { msalInstance } from "./lib/msalConfig/msalInstance";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const init = async () => {
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <PopupProvider>
              <App />
            </PopupProvider>
          </BrowserRouter>
        </MsalProvider>
      </QueryClientProvider>
    </StrictMode>
  );
};

init();
