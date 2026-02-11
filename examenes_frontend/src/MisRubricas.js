import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importa useNavigate
import "./MisRubricas.css";

function MisRubricas({ usuario, onVolver }) {
  const navigate = useNavigate(); // Hook para navegación

  const [rubricas, setRubricas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rubricaAEliminar, setRubricaAEliminar] = useState(null);
  const [rubricaEditando, setRubricaEditando] = useState(null);
  const [editRubrica, setEditRubrica] = useState(null); // local editing copy

  // Fetch rúbricas
  const cargarRubricas = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/rubricas/${usuario.email}`);
      if (!resp.ok) throw new Error("Error al obtener rúbricas");
      const data = await resp.json();
      setRubricas(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarRubricas();
    // eslint-disable-next-line
  }, [usuario?.email]);

  const eliminarRubrica = async (id) => {
    try {
      const resp = await fetch(`http://localhost:8000/rubricas/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("No se pudo eliminar la rúbrica");
      setRubricas(rubricas.filter(r => r._id !== id));
      setRubricaAEliminar(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // ===== EDICIÓN =====
  const abrirEditarRubrica = (rubrica) => {
    setEditRubrica({
      ...rubrica,
      preguntas: rubrica.preguntas.map(p => ({
        ...p,
        enunciados: p.enunciados.map(e => ({ ...e }))
      }))
    });
    setRubricaEditando(rubrica);
  };

  const handleEditChange = (campo, valor) => {
    setEditRubrica(edit => ({ ...edit, [campo]: valor }));
  };

  const handleCriterioEdit = (iPregunta, iEnunciado, campo, valor) => {
    setEditRubrica(edit => ({
      ...edit,
      preguntas: edit.preguntas.map((p, iP) => {
        if (iP !== iPregunta) return p;
        return {
          ...p,
          enunciados: p.enunciados.map((enun, iE) =>
            iE === iEnunciado ? { ...enun, [campo]: valor } : enun
          )
        };
      }),
    }));
  };

  const handleGuardarEdicion = async () => {
    try {
      const resp = await fetch(`http://localhost:8000/rubricas/${editRubrica._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editRubrica.nombre,
          preguntas: editRubrica.preguntas,
        })
      });
      if (!resp.ok) throw new Error("Error actualizando rúbrica");
      setRubricas(rubricas.map(r => r._id === editRubrica._id ? editRubrica : r));
      setRubricaEditando(null);
      setEditRubrica(null);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="mis-rubricas-container">
      <div className="rubricas-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Mis Rúbricas</h2>
        <button
          className="rubricas-btn rubricas-crear"
          onClick={() => navigate('/crear-rubrica')} // Navegación directa
          style={{ padding: '6px 12px', fontSize: '1rem', cursor: 'pointer' }}
        >
          + Nueva rúbrica
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p className="rubricas-error">{error}</p>
      ) : rubricas.length === 0 ? (
        <p>No tienes rúbricas creadas.</p>
      ) : (
        <table className="rubricas-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Nº Criterios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rubricas.map(r => (
              <tr key={r._id}>
                <td>{r.nombre}</td>
                <td>{r.preguntas?.reduce((sum, p) => sum + (p.enunciados?.length || 0), 0)}</td>
                <td>
                  <button
                    className="rubricas-btn rubricas-editar"
                    onClick={() => abrirEditarRubrica(r)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="rubricas-btn rubricas-eliminar"
                    onClick={() => setRubricaAEliminar(r)}
                  >
                    🗑 Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rubricaAEliminar && (
        <div className="rubricas-modal-overlay">
          <div className="rubricas-modal">
            <h4>¿Eliminar rúbrica?</h4>
            <p>
              ¿Seguro que quieres eliminar la rúbrica <b>{rubricaAEliminar.nombre}</b>?
              Esta acción no se puede deshacer.
            </p>
            <div className="rubricas-modal-actions">
              <button
                className="rubricas-btn rubricas-eliminar"
                onClick={() => eliminarRubrica(rubricaAEliminar._id)}
              >
                Sí, eliminar
              </button>
              <button
                className="rubricas-btn rubricas-cancelar"
                onClick={() => setRubricaAEliminar(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {rubricaEditando && editRubrica && (
        <div className="rubricas-modal-overlay">
          <div className="rubricas-modal editar-rubrica-modal">
            <h4>Editar rúbrica</h4>
            <label>
              Nombre:
              <input
                className="rubricas-edit-input"
                type="text"
                value={editRubrica.nombre}
                onChange={e => handleEditChange("nombre", e.target.value)}
              />
            </label>
            {editRubrica.preguntas.map((pregunta, iPregunta) => (
              <div className="criterios-editar-lista" key={iPregunta}>
                <h5 className="criterios-editar-pregunta-titulo">{`Pregunta ${iPregunta + 1}`}</h5>
                {pregunta.enunciados.map((c, idx) => (
                  <div className="criterio-edit-row" key={idx}>
                    <textarea
                      className="criterio-edit-criterio"
                      value={c.criterio}
                      onChange={e => handleCriterioEdit(iPregunta, idx, "criterio", e.target.value)}
                      placeholder="Texto del criterio"
                      rows={2}
                      style={{
                        width: '100%',
                        minWidth: '220px',
                        maxWidth: '520px',
                        padding: '8px 12px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        resize: 'vertical',        // El usuario puede agrandarlo
                        marginBottom: '4px'
                      }}
                    />
                    <input
                      className="criterio-edit-puntos"
                      type="number"
                      min={0}
                      value={c.puntos}
                      onChange={e => handleCriterioEdit(iPregunta, idx, "puntos", parseInt(e.target.value) || 0)}
                      placeholder="Puntos"
                      style={{
                        width: '70px',
                        padding: '8px 6px',
                        fontSize: '1rem',
                        marginLeft: '10px',
                        boxSizing: 'border-box'
                      }}
                    />

                  </div>
                ))}
              </div>
            ))}
            <div className="rubricas-modal-actions">
              <button
                className="rubricas-btn rubricas-editar"
                onClick={handleGuardarEdicion}
              >
                Guardar cambios
              </button>
              <button
                className="rubricas-btn rubricas-cancelar"
                onClick={() => { setRubricaEditando(null); setEditRubrica(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisRubricas;
