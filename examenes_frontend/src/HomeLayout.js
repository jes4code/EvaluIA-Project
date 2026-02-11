import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logo from "./assets/correccion.png"; // importa tu logo
import "./HomeLayout.css";

function HomeLayout() {
  const navigate = useNavigate();

  return (
    <div className="app-background">
      <nav className="navbar-centered">
        <div className="navbar-content" style={{ justifyContent: "space-between" }}>
          <div
            className="navbar-logo"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => navigate("/inicio")}
          >
            <img
              src={logo}
              alt="Logo EvaluIA"
              height={40}
              style={{ marginRight: 10, borderRadius: 6 }}
            />
            <span style={{ color: "#fff", fontWeight: "600", fontSize: "1.25rem" }}>EvaluIA</span>
          </div>
          <div>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/inicio")}
              style={{ marginRight: 10 }}
            >
              Inicio
            </button>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/login")}
              style={{ marginRight: 10 }}
            >
              Iniciar sesión
            </button>
            <button
              className="navbar-login-btn"
              onClick={() => navigate("/register")}
            >
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Aquí se renderizan las páginas internas de inicio, login, registro... */}
      <Outlet />
    </div>
  );
}

export default HomeLayout;
