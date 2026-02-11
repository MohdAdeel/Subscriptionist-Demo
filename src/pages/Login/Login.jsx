import React, { useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../../lib/msalConfig/authConfig";

function Login() {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (inProgress !== "none") return;
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const checkRedirect = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        if (response) {
          navigate("/", { replace: true });
          return;
        }
        if (accounts.length === 0) {
          instance.loginRedirect(loginRequest);
        } else {
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Login failed:", err);
        hasAttempted.current = false;
      }
    };

    checkRedirect();
  }, [instance, inProgress, accounts.length, navigate]);
}

export default Login;
