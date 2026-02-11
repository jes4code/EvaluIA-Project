import React, { useState, useEffect, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Inicio from "./Inicio";
import Login from "./Login";
import Register from "./Register";
import CorregirExamen from "./CorregirExamen";
import VisualizarResultados from "./VisualizarResultados";
import VisualizarConjuntos from "./VisualizarConjuntos";
import CorregirConjuntos from "./CorregirConjuntos";
import CrearRubrica from "./CrearRubrica";
import EstudianteDashboard from "./EstudianteDashboard";
import ProfesorDashboard from "./ProfesorDashboard";
import MisExamenes from "./MisExamenes";
import MisRubricas from "./MisRubricas";
import EditarCorreccion from "./EditarCorreccion";
import LayoutNavbar from "./LayoutNavbar";
import HomeLayout from "./HomeLayout";

// Contexto para usuario global
export const UserContext = createContext(null);


// Componente para rutas privadas que redirige al login si no hay usuario
function PrivateRoute({ usuario, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}


function App() {
  // Estado usuario inicial desde localStorage para persistencia
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });

  // Guarda usuario en localStorage cada vez que cambia
  useEffect(() => {
    if (usuario) {
      localStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      localStorage.removeItem("usuario");
    }
  }, [usuario]);

  return (
    <UserContext.Provider value={{ usuario, setUsuario }}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/inicio" replace />} />

          {/* Rutas públicas */}
          <Route element={<HomeLayout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/login" element={<Login onLogin={setUsuario} />} />
            <Route path="/register" element={<Register />} />
          </Route>
          {/* Rutas privadas protegidas */}
          <Route
            path="/profesor-dashboard"
            element={
              <PrivateRoute usuario={usuario}>
                <ProfesorDashboard usuario={usuario} onLogout={() => setUsuario(null)} />
              </PrivateRoute>
            }
          />
          <Route
            path="/estudiante-dashboard"
            element={
              <PrivateRoute usuario={usuario}>
                <EstudianteDashboard usuario={usuario} onLogout={() => setUsuario(null)} />
              </PrivateRoute>
            }
          />
          <Route element={<LayoutNavbar usuario={usuario} onLogout={() => setUsuario(null)} />}>
          <Route
            path="/corregir-examen"
            element={
              <PrivateRoute usuario={usuario}>
                <CorregirExamen usuario={usuario} />
              </PrivateRoute>
            }
          />
          {/* Añade PrivateRoute igual para estas si son rutas protegidas */}
          <Route
            path="/visualizar-resultados/:examenIdTemporal"
            element={
              <PrivateRoute usuario={usuario}>
                <VisualizarResultados usuario={usuario}/>
              </PrivateRoute>
            }
          />
          <Route
            path="/visualizar-conjuntos"
            element={
              <PrivateRoute usuario={usuario}>
                <VisualizarConjuntos usuario={usuario} />
              </PrivateRoute>
            }
          />
          <Route
            path="/corregir-conjuntos"
            element={
              <PrivateRoute usuario={usuario}>
                <CorregirConjuntos usuario={usuario}/>
              </PrivateRoute>
            }
          />
          <Route
            path="/editar-correccion/:examenId"
            element={
              <PrivateRoute usuario={usuario}>
                <EditarCorreccion usuario={usuario}/>
              </PrivateRoute>
            }
          />
          <Route
            path="/crear-rubrica"
            element={
              <PrivateRoute usuario={usuario}>
                <CrearRubrica usuario={usuario}/>
              </PrivateRoute>
            }
          />
          <Route
            path="/mis-examenes"
            element={
              <PrivateRoute usuario={usuario}>
                <MisExamenes usuario={usuario}/>
              </PrivateRoute>
            }
          />
          <Route
            path="/mis-rubricas"
            element={
              <PrivateRoute usuario={usuario}>
                <MisRubricas usuario={usuario} />
              </PrivateRoute>
            }
          />

          {/* Aquí puedes añadir más rutas */}
            </Route>
        </Routes>
      </Router>
    </UserContext.Provider>
  );
}

export default App;