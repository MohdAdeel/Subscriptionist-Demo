import React from "react";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Report from "../pages/Reports/Report";
import Vendor from "../pages/Vendors/Vendor";
// import Profile from "../pages/Profile/Profile";
import ProtectedRoutes from "./ProtectedRoutes";
import { Routes, Route } from "react-router-dom";
import Subscription from "../pages/Subscriptions/Subscription";
function AppRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/vendors" element={<Vendor />} />
        <Route path="/subscriptions" element={<Subscription />} />
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Route>
    </Routes>
  );
}

export default AppRoutes;
