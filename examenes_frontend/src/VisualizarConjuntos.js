import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./VisualizarConjuntos.css";

function VisualizarConjuntos({ onSalir }) {
  const location = useLocation();
  const navigate = useNavigate();
  const examenesIds = location.state?.examenesIds || [];
  const [pendientes, setPendientes] = useState(examenesIds);
  const [indiceActual, setIndiceActual] = useState(0);

  const examenId = pendientes[indiceActual];

  const [correccion, setCorreccion] = useState([]);
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [comentarioGeneral, setComentarioGeneral] = useState("");
  const [notaAsignada, setNotaAsignada] = useState(0);
  const [notaMax, setNotaMax] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!examenId) return;

    fetch(`http://localhost:8000/examenes_temporales/${examenId}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el examen temporal");
        return res.json();
      })
      .then((data) => {
        const corr = Array.isArray(data.correccion)
          ? data.correccion
          : Array.isArray(data.correccion?.correccion)
          ? data.correccion.correccion
          : [];
        setCorreccion(corr);
        setNombreAlumno(data.nombre_alumno || (corr[0]?.nombre_alumno || ""));
        setComentarioGeneral(data.comentario_general || "");
        setNotaAsignada(data.correccion?.nota_asignada ?? 0);
        setNotaMax(data.correccion?.nota_max ?? 10);
      })
      .catch(() => {
        setCorreccion([]);
        setNombreAlumno("");
        setComentarioGeneral("");
        setNotaAsignada(0);
        setNotaMax(0);
      });
  }, [examenId]);

  const handleChange = (index, field, value) => {
    setCorreccion((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleGuardarYAvanzar = async () => {
  setGuardando(true);
  try {
    // 1. Actualizar examen temporal con PUT para guardar edición
    const putResp = await fetch(`http://localhost:8000/examenes_temporales/${examenId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correccion,
        nombre_alumno: nombreAlumno,
        comentario_general: comentarioGeneral,
        nota_asignada: notaAsignada,
        nota_max: notaMax,
      }),
    });

    if (!putResp.ok) {
      const errorText = await putResp.text();
      throw new Error(errorText || "Error al actualizar examen temporal");
    }

    // 2. Confirmar corrección - pasar examen temporal a definitivo
    const postResp = await fetch(`http://localhost:8000/examenes/guardar_correccion/${examenId}`, {
      method: "POST",
    });

    if (!postResp.ok) {
      const errorText = await postResp.text();
      throw new Error(errorText || "Error al guardar corrección definitiva");
    }

    alert("Corrección guardada correctamente");

    // Avanzar al siguiente examen o terminar
    if (indiceActual + 1 < pendientes.length) {
      setIndiceActual(indiceActual + 1);
    } else {
      if (onSalir) onSalir();
      navigate("/mis-examenes");
    }
  } catch (e) {
    alert("Error al guardar corrección: " + e.message);
    console.error(e);
  } finally {
    setGuardando(false);
  }
};

  if (!examenId) {
    return <p className="visualizar-conjuntos-no-data">Revisión finalizada. No hay más exámenes por corregir.</p>;
  }

  return (
    <div className="visualizar-conjuntos-container">
      <h2 className="visualizar-conjuntos-title">
        Visualizar y editar corrección ({indiceActual + 1} de {pendientes.length})
      </h2>

      <div className="visualizar-conjuntos-infos">
        <label>
          <span className="visualizar-conjuntos-infos-label">Alumno:</span>
          <input
            type="text"
            value={nombreAlumno}
            onChange={(e) => setNombreAlumno(e.target.value)}
            placeholder="Nombre del alumno"
          />
        </label>

        <label>
          <span className="visualizar-conjuntos-infos-label">Nota asignada:</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={notaAsignada}
            onChange={(e) => setNotaAsignada(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="visualizar-conjuntos-infos-label">Nota máxima:</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={notaMax}
            onChange={(e) => setNotaMax(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="visualizar-conjuntos-infos-label">Comentario general:</span>
          <textarea
            rows={5}
            value={comentarioGeneral}
            onChange={(e) => setComentarioGeneral(e.target.value)}
            placeholder="Comentario general sobre el examen"
          />
        </label>
      </div>

      {correccion.length === 0 && <p className="visualizar-conjuntos-no-data">No hay datos para mostrar</p>}

      {guardando && <p className="visualizar-conjuntos-saving">Guardando cambios...</p>}

      <div className="visualizar-conjuntos-notas">
        {correccion.map((pregunta, idx) => (
          <div className="visualizar-conjuntos-nota" key={idx}>
            <label>
              <strong>Enunciado:</strong>
              <textarea
                rows={3}
                value={pregunta.enunciado || ""}
                onChange={(e) => handleChange(idx, "enunciado", e.target.value)}
              />
            </label>
            <label>
              <strong>Respuesta:</strong>
              <textarea
                rows={3}
                value={pregunta.respuesta || ""}
                onChange={(e) => handleChange(idx, "respuesta", e.target.value)}
              />
            </label>
            <label>
              <strong>Comentarios:</strong>
              <textarea
                rows={3}
                value={pregunta.comentarios || ""}
                onChange={(e) => handleChange(idx, "comentarios", e.target.value)}
              />
            </label>

            <label>
              Puntuación máxima: {pregunta["puntuacion_max"] ?? "N/A"}
            </label>

            <label>
              Puntuación asignada:&nbsp;
              <input
                type="number"
                step="0.25"
                min={0}
                max={pregunta["puntuacion_max"] ?? 10}
                value={pregunta["puntuacion_asignada"] ?? 0}
                onChange={(e) =>
                  handleChange(
                    idx,
                    "puntuacion_asignada",
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                style={{ width: 60 }}
              />
            </label>
          </div>
        ))}
      </div>

      <button
        className="visualizar-conjuntos-guardar-btn"
        onClick={handleGuardarYAvanzar}
        disabled={guardando}
      >
        {guardando
          ? "Guardando..."
          : indiceActual + 1 === pendientes.length
          ? "Guardar y terminar"
          : "Guardar y siguiente examen"}
      </button>
    </div>
  );
}

export default VisualizarConjuntos;
