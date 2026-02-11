import React, { useState, useEffect, useRef } from "react";
import { useLocation, Navigate, useParams, useNavigate } from "react-router-dom";
import "./VisualizarConjuntos.css";

function EditarCorreccion() {
  const location = useLocation();
  const { examenId } = useParams();
  const navigate = useNavigate();

  const resultado = location.state?.resultado || null;

  const [correccion, setCorreccion] = useState([]);
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [comentarioGeneral, setComentarioGeneral] = useState("");
  const [notaAsignada, setNotaAsignada] = useState(0);
  const [notaMax, setNotaMax] = useState(0);
  const [guardando, setGuardando] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!examenId) return;
    fetch(`http://localhost:8000/examenes/${examenId}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la corrección definitiva");
        return res.json();
      })
      .then((data) => {
        const corr = Array.isArray(data.correccion)
          ? data.correccion
          : data.correccion?.correccion || [];
        setCorreccion(corr);
        setNombreAlumno(data.nombre_alumno || (data.correccion?.[0]?.nombre_alumno || ""));
        setComentarioGeneral(data.comentario_general || "");
        setNotaAsignada(data.correccion.nota_asignada ?? 0);
        setNotaMax(data.correccion.nota_max ?? 10);
      })
      .catch((e) => {
        console.error(e);
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

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const resp = await fetch(`http://localhost:8000/examenes/${examenId}`, {
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
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || "Error desconocido al guardar corrección");
      }
      alert("Corrección guardada correctamente");
      navigate("/mis-examenes");
    } catch (e) {
      alert("Error al guardar corrección: " + e.message);
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="visualizar-conjuntos-container">
      <h2 className="visualizar-conjuntos-title">Visualizar y editar corrección</h2>

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
            step="0.1"
            value={notaAsignada}
            min={0}
            max={notaMax}
            onChange={(e) => setNotaAsignada(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="visualizar-conjuntos-infos-label">Nota máxima:</span>
          <input
            type="number"
            step="0.1"
            value={notaMax}
            min={0}
            max={100}
            onChange={(e) => setNotaMax(Number(e.target.value))}
          />
        </label>

        <label>
          <span className="visualizar-conjuntos-infos-label">Comentario general:</span>
          <textarea
            rows={4}
            value={comentarioGeneral}
            onChange={(e) => setComentarioGeneral(e.target.value)}
            placeholder="Comentario general sobre el examen"
          />
        </label>
      </div>

      <div className="visualizar-conjuntos-notas">
        {correccion.length === 0 && <p className="visualizar-conjuntos-no-data">No hay datos para mostrar</p>}

        {guardando && <p className="visualizar-conjuntos-saving">Guardando cambios...</p>}

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
              Puntuación máxima:&nbsp;
              {pregunta["puntuacion_max"] ?? "N/A"}
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
        onClick={handleGuardar}
        disabled={guardando}
      >
        {guardando ? "Guardando..." : "Guardar corrección"}
      </button>
    </div>
  );
}

export default EditarCorreccion;
