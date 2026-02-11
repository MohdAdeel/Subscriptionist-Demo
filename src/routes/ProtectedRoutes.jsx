import React from "react";
import Menu from "../components/menu";
import Header from "../components/Header";
import { Navigate, Outlet } from "react-router-dom";
import { useIsAuthenticated } from "@azure/msal-react";

function ProtectedRoutes() {
  const isAuthenticated = useIsAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout flex h-screen">
      <Menu />
      <div className="app-content flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ProtectedRoutes;
