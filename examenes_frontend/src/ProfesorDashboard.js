import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProfesorDashboard.css";

function ProfesorDashboard({ usuario, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    // Navegar al login con replace para evitar volver atrás
    navigate("/login", { replace: true });
  };

  return (
    <div className="profesor-dashboard">
      <header className="profesor-header">
        <h2>Bienvenido/a, {usuario?.nombre || usuario?.email || "profesor"}</h2>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar sesión
        </button>
      </header>

      <main className="profesor-menu">
        <div className="menu-card" onClick={() => navigate("/mis-examenes")}>
          📄
          <h3>Mis exámenes corregidos</h3>
          <p>Consulta y gestiona tus exámenes existentes.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/mis-rubricas")}>
          📑
          <h3>Mis rúbricas</h3>
          <p>Gestiona criterios y rúbricas para la corrección.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/crear-rubrica")}>
          ➕
          <h3>Crear rúbrica</h3>
          <p>Define criterios, descripciones y puntos para la corrección.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/corregir-examen")}>
          📝
          <h3>Corregir examen individual</h3>
          <p>Sube y corrige un solo examen.</p>
        </div>

        <div className="menu-card" onClick={() => navigate("/corregir-conjuntos")}>
          📦
          <h3>Corregir exámenes conjuntos</h3>
          <p>Corrige varios exámenes de una sola vez.</p>
        </div>
      </main>
    </div>
  );
}

export default ProfesorDashboard;
