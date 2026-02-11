// LayoutConNavbar.js
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function LayoutConNavbar({ usuario, onLogout }) {
  return (
    <>
      <Navbar usuario={usuario} onLogout={onLogout} />
      <main style={{ padding: "20px 24px", minHeight: "calc(100vh - 64px)" }}>
        <Outlet />
      </main>
    </>
  );
}

export default LayoutConNavbar;
