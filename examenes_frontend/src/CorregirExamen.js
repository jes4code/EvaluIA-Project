import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CorregirExamen.css";

function CorregirExamen({ usuario, onVolver }) {
  const [rubricas, setRubricas] = useState([]);
  const [rubricaSeleccionada, setRubricaSeleccionada] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Cargar las rúbricas del profesor
  useEffect(() => {
    if (!usuario?.email) return;
    fetch(`http://localhost:8000/rubricas/${usuario.email}`)
      .then(res => res.json())
      .then(data => setRubricas(data))
      .catch(err => console.error(err));
  }, [usuario?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pdf) {
      alert("Debes subir un PDF");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("pdf", pdf);
    if (rubricaSeleccionada) formData.append("rubrica_id", rubricaSeleccionada);
    formData.append("comentarios", comentarios);
    if (usuario?.id) formData.append("usuario_id", usuario.id);

    try {
      const resp = await fetch("http://localhost:8000/examenes_temporales/corregir-examen", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Error ${resp.status}: ${errorText}`);
      }

      const data = await resp.json();
      const examenIdTemporal = data.examen_id_temporal;
      navigate(`/visualizar-resultados/${examenIdTemporal}`, { state: { resultado: data } });

      setRubricaSeleccionada("");
      setComentarios("");
      setPdf(null);

    } catch (err) {
      alert(`Error al enviar el examen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="corregir-examen-container">
      <h2>Corregir examen</h2>
      <form className="corregir-examen-form" onSubmit={handleSubmit}>
        <label>
          Rúbrica:
          <select
            value={rubricaSeleccionada}
            onChange={e => setRubricaSeleccionada(e.target.value)}
          >
            <option value="">Elige rúbrica</option>
            {rubricas.map(r => (
              <option key={r.id || r._id} value={r.id || r._id}>{r.nombre}</option>
            ))}
          </select>
        </label>
        <label>
          Comentarios al corrector automático:
          <textarea
            value={comentarios}
            onChange={e => setComentarios(e.target.value)}
            rows={2}
          />
        </label>
        <label>
          PDF del examen:
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setPdf(e.target.files[0])}
          />
        </label>
        <div className="corregir-examen-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : "Corregir"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CorregirExamen;
