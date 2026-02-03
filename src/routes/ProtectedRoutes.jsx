import React from "react";
import Menu from "../components/menu";
import Header from "../components/Header";
import { Navigate, Outlet } from "react-router-dom";

// TODO: replace this with real auth state
const isAuthenticated = true;

function ProtectedRoutes() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Calculate last update time (2 hours ago as example)
  const lastUpdate = new Date();
  lastUpdate.setHours(lastUpdate.getHours() - 2);

  return (
    <div className="app-layout flex h-screen">
      <Menu />
      <div className="app-content flex-1 flex flex-col overflow-hidden">
        <Header userName="John Doe" lastUpdateTime={lastUpdate} userPhoto={null} />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ProtectedRoutes;
