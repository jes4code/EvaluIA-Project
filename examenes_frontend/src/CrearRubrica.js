import React, { useState } from "react";
import "./CrearRubrica.css";

function CrearRubrica({ usuario, onVolver }) {
  const [nombre, setNombre] = useState("");
  const [preguntas, setPreguntas] = useState([
    { texto: "", enunciados: [{ criterio: "", puntos: "" }] }
  ]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const handlePreguntaTextoChange = (iPregunta, valor) => {
    setPreguntas(prev =>
      prev.map((p, i) =>
        i === iPregunta
          ? { ...p, texto: valor }
          : p
      )
    );
  };

  const handleEnunciadoChange = (iPregunta, iEnunciado, campo, valor) => {
    setPreguntas(prev =>
      prev.map((p, i) => {
        if (i !== iPregunta) return p;
        const nuevosEnunciados = p.enunciados.map((e, j) =>
          j === iEnunciado ? { ...e, [campo]: valor } : e
        );
        return { ...p, enunciados: nuevosEnunciados };
      })
    );
  };

  const agregarPregunta = () => {
    setPreguntas(prev => [...prev, { texto: "", enunciados: [{ criterio: "", puntos: "" }] }]);
  };

  const eliminarPregunta = (iPregunta) => {
    setPreguntas(prev => prev.filter((_, i) => i !== iPregunta));
  };

  const agregarEnunciado = (iPregunta) => {
    setPreguntas(prev =>
      prev.map((p, i) =>
        i === iPregunta
          ? { ...p, enunciados: [...p.enunciados, { criterio: "", puntos: "" }] }
          : p
      )
    );
  };

  const eliminarEnunciado = (iPregunta, iEnunciado) => {
    setPreguntas(prev =>
      prev.map((p, i) =>
        i === iPregunta
          ? { ...p, enunciados: p.enunciados.filter((_, j) => j !== iEnunciado) }
          : p
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    try {
      const resp = await fetch("http://localhost:8000/rubricas/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creador: usuario.email,
          nombre,
          preguntas,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.detail || "Error al crear la rúbrica");
      }

      await resp.json();
      setMensaje("Rúbrica creada con éxito ✅");
      setNombre("");
      setPreguntas([{ texto: "", enunciados: [{ criterio: "", puntos: "" }] }]);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="crear-rubrica-container">
      <h2>Crear rúbrica</h2>
      {mensaje && <p className="crear-rubrica-mensaje">{mensaje}</p>}
      {error && <p className="crear-rubrica-error">{error}</p>}

      <form onSubmit={handleSubmit} className="crear-rubrica-form">
        <div className="crear-rubrica-nombre">
          <label>Nombre de la rúbrica</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </div>

        {preguntas.map((pregunta, iPregunta) => (
          <div key={iPregunta} className="pregunta-bloque">
            <div className="pregunta-header">
              <label>{`Pregunta ${iPregunta + 1}`}</label>
              {preguntas.length > 1 && (
                <button
                  type="button"
                  className="eliminar-pregunta-btn"
                  onClick={() => eliminarPregunta(iPregunta)}
                  title="Eliminar pregunta"
                >
                  ❌
                </button>

              )}
            </div>
            <textarea
              className="pregunta-texto"
              value={pregunta.texto}
              onChange={(e) => handlePreguntaTextoChange(iPregunta, e.target.value)}
              required
              placeholder="Escribe el enunciado principal de la pregunta"
              rows={2}
              style={{ marginBottom: "18px", width: "100%" }}
            />
            <table className="tabla-enunciados">
              <thead>
                <tr>
                  <th>Criterio</th>
                  <th>Puntos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pregunta.enunciados.map((enunciado, iEnunciado) => (
                  <tr key={iEnunciado}>
                    <td>
                      <textarea
                        value={enunciado.criterio}
                        onChange={e => handleEnunciadoChange(iPregunta, iEnunciado, "criterio", e.target.value)}
                        required
                        placeholder="Criterio detallado"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={enunciado.puntos}
                        onChange={e => handleEnunciadoChange(iPregunta, iEnunciado, "puntos", e.target.value)}
                        required
                        placeholder="Puntos"
                      />
                    </td>
                    <td>
                      {pregunta.enunciados.length > 1 && (
                        <button
                          type="button"
                          className="eliminar-enunciado-btn"
                          onClick={() => eliminarEnunciado(iPregunta, iEnunciado)}
                          title="Eliminar criterio"
                        >
                          ❌
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="agregar-enunciado-btn"
              onClick={() => agregarEnunciado(iPregunta)}
            >
              + Añadir criterio
            </button>
          </div>
        ))}

        <button
          type="button"
          className="agregar-pregunta-btn"
          onClick={agregarPregunta}
        >
          + Añadir pregunta
        </button>
        <button
          type="submit"
          className="guardar-rubrica-btn"
        >
          Guardar rúbrica
        </button>
      </form>
    </div>
  );
}

export default CrearRubrica;
