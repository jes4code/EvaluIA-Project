import React from "react";
import { NavLink, Link } from "react-router-dom";
import logoImg from "./assets/correccion.png"; // Asegúrate de tener un logo en la ruta correcta
import "./Navbar.css";

function Navbar({ onLogout }) {
  return (
    <nav className="navbar-pill">
        <div className="navbar-container">
            <div className="navbar-brand">
            <Link to="/profesor-dashboard" className="navbar-logo-link" aria-label="Inicio">
                <img src={logoImg} alt="Logo EvaluIA" style={{width: '100px', height: 'auto'}} />
            </Link>
            <span className="navbar-brand-name">EvaluIA</span>
            </div>
            <div className="navbar-actions">
            <NavLink to="/mis-examenes" className="navbar-pill-btn">Mis exámenes</NavLink>
            <NavLink to="/mis-rubricas" className="navbar-pill-btn">Mis rúbricas</NavLink>
            <NavLink to="/crear-rubrica" className="navbar-pill-btn">Crear rúbrica</NavLink>
            <NavLink to="/corregir-examen" className="navbar-pill-btn">Corregir examen individual</NavLink>
            <NavLink to="/corregir-conjuntos" className="navbar-pill-btn">Corregir exámenes conjuntos</NavLink>
            <button className="navbar-pill-btn btn-navbar-logout" onClick={onLogout}>Cerrar sesión</button>
            </div>
        </div>
        </nav>
  );
}

export default Navbar;
