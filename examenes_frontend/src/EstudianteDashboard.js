import React from "react";

function EstudianteDashboard({ usuario, onLogout }) {
  return (
    <div>
      <header>
        <h2>Hola, {usuario.nombre} (Estudiante)</h2>
        <button onClick={onLogout}>Cerrar sesión</button>
      </header>
      {/* Aquí tu feedback, oportunidades de mejora, historial, etc */}
      <p>Puedes ver tu feedback, repasar respuestas, consultar recursos y recibir consejos personalizados para mejorar.</p>
    </div>
  );
}

export default EstudianteDashboard;
