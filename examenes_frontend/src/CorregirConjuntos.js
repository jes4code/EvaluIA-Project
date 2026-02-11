import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CorregirConjuntos.css";

function CorregirConjuntos({ usuario, onVolver }) {
  const [modo, setModo] = useState("varios");
  const [numPaginas, setNumPaginas] = useState(1);
  const [archivos, setArchivos] = useState([]);
  const [rubricas, setRubricas] = useState([]);
  const [rubricaSeleccionada, setRubricaSeleccionada] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario?.email) return;
    fetch(`http://localhost:8000/rubricas/${usuario.email}`)
      .then(res => res.json())
      .then(data => setRubricas(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, [usuario?.email]);

  const handleArchivosChange = e => {
    setArchivos(Array.from(e.target.files));
  };

  const handleEnviar = async e => {
    e.preventDefault();
    if (archivos.length === 0) {
      alert("Debes subir al menos un archivo PDF.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    archivos.forEach(file => formData.append("archivos", file));
    formData.append("modo", modo);
    formData.append("rubrica_id", rubricaSeleccionada);
    formData.append("comentarios", comentarios);
    if (modo === "unico") {
      formData.append("num_paginas", numPaginas);
    }
    if (usuario?.id) {
      formData.append("usuario_id", usuario.id);
    }

    try {
      const resp = await fetch("http://localhost:8000/examenes_temporales/corregir_conjuntos", {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Error ${resp.status}: ${errorText}`);
      }
      const data = await resp.json();
      const nuevosIds = data.resultados
        .map(r => r.examen_id_temporal || r.examen_id)
        .filter(Boolean);

      if (nuevosIds.length > 0) {
        navigate("/visualizar-conjuntos", { state: { examenesIds: nuevosIds } });
      }

      setArchivos([]);
      setComentarios("");
      setRubricaSeleccionada("");
    } catch (err) {
      alert(`Error al corregir exámenes conjuntos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="corregir-conjuntos-container">
      {onVolver && (
        <button 
          className="corregir-conjuntos-volver-btn" 
          onClick={onVolver}
          type="button"
        >
          ⬅ Volver
        </button>
      )}
      <h2>Corregir exámenes conjuntos</h2>
      <form className="corregir-conjuntos-form" onSubmit={handleEnviar}>
        <div className="corregir-conjuntos-radio-group">
          <label>
            <input
              type="radio"
              value="varios"
              checked={modo === "varios"}
              onChange={() => setModo("varios")}
            />
            Subir varios PDF (examen por archivo)
          </label>
          <label>
            <input
              type="radio"
              value="unico"
              checked={modo === "unico"}
              onChange={() => setModo("unico")}
            />
            Subir único PDF con todos los exámenes
          </label>
        </div>

        {modo === "varios" && (
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleArchivosChange}
            required
          />
        )}
        {modo === "unico" && (
          <>
            <input
              type="file"
              accept=".pdf"
              onChange={handleArchivosChange}
              required
            />
            <label className="num-paginas-label">
              Nº de páginas por examen:{" "}
              <input
                type="number"
                min={1}
                value={numPaginas}
                onChange={e => setNumPaginas(e.target.value)}
                required={modo === "unico"}
              />
            </label>
          </>
        )}

        <label>
          Rúbrica de corrección:
          <select
            value={rubricaSeleccionada}
            onChange={e => setRubricaSeleccionada(e.target.value)}
          >
            <option value="">Selecciona una rúbrica</option>
            {rubricas.map(r => (
              <option key={r._id || r.id} value={r._id || r.id}>
                {r.nombre || r.titulo}
              </option>
            ))}
          </select>
        </label>

        <label>
          Comentarios generales:
          <textarea
            rows={3}
            value={comentarios}
            onChange={e => setComentarios(e.target.value)}
            placeholder="Criterios o comentarios generales para la corrección"
          />
        </label>

        <div className="corregir-conjuntos-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Corregir exámenes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CorregirConjuntos;
