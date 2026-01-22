import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Menu from "../components/menu";

// TODO: replace this with real auth state
const isAuthenticated = true;

function ProtectedRoutes() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Menu />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}

export default ProtectedRoutes;
