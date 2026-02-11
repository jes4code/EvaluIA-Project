import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MisExamenes.css";

function MisExamenes({ usuario, onVolver }) {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario?.id) return;
    const fetchExamenes = async () => {
      try {
        const resp = await fetch(`http://localhost:8000/examenes/todos_mis_examenes/${usuario.id}`);
        if (!resp.ok) {
          throw new Error(`Error al cargar exámenes: ${resp.statusText}`);
        }
        const data = await resp.json();
        setExamenes(data.examenes || []);
      } catch (err) {
        console.error("Error cargando exámenes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamenes();
  }, [usuario?.id]);

  if (loading) return <p>Cargando exámenes...</p>;

  if (examenes.length === 0)
    return (
      <div className="mis-examenes-container">
        {onVolver && (
          <button onClick={onVolver} className="btn-volver">
            ⬅ Volver
          </button>
        )}
        <p>No tienes exámenes almacenados.</p>
      </div>
    );

  const textoEstado = (estado) =>
    estado === "success" ? "Corregido" : "Pendiente de revisión";

  const handleVerEditar = (ex) => {
    if (ex.estado === "success") {
      navigate(`/editar-correccion/${ex._id}`);
    } else if (ex.estado === "pendiente_revision") {
      navigate(`/visualizar-resultados/${ex._id}`, { state: { resultado: ex } });
    } else {
      alert("No se puede navegar: estado o tipo desconocido");
    }
  };

  return (
    <div className="mis-examenes-container">
      <div className="mis-examenes-header">
        <h2>Mis Exámenes</h2>
        {onVolver && (
          <button onClick={onVolver} className="btn-volver" aria-label="Volver">
            ⬅ Volver
          </button>
        )}
      </div>

      <table className="mis-examenes-table">
        <thead>
          <tr>
            <th>Nombre archivo</th>
            <th>Estudiante</th>
            <th>Nota obtenida</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {examenes.map((ex) => {
            const nota = ex.correccion?.nota_asignada ?? ex.nota_asignada ?? ex.nota ?? "-";
            const nombreArchivo = ex.nombre_archivo || ex.nombre || "Sin nombre";
            const nombreAlumno = ex.nombre_alumno || ex.correccion?.nombre_alumno || "-";
            return (
              <tr
                key={ex._id}
                className={ex.estado === "success" ? "corrected" : "pending"}
                onClick={() => handleVerEditar(ex)}
              >
                <td>{nombreArchivo}</td>
                <td>{nombreAlumno}</td>
                <td>{nota}</td>
                <td>
                  {ex.correccion?.metadata?.timestamp
                    ? new Date(ex.correccion.metadata.timestamp.replace(" ", "T")).toLocaleDateString()
                    : "-"}
                </td>
                <td>{textoEstado(ex.estado)}</td>
                <td>
                  {ex.estado === "success" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`http://localhost:8000/examenes/descargar_informe/${ex._id}`, "_blank");
                      }}
                      className="btn-descargar"
                    >
                      Descargar informe
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default MisExamenes;
