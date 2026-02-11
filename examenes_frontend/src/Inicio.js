import React from "react";
import "./Inicio.css";
import imgEscaneo from './assets/escaneo.png';
import imgCorreccion from './assets/correccion.png';
import imgInformes from './assets/informes.png';

function Inicio() {
  return (
    <main className="main-content">
      <div className="inicio-hero">
        <div className="inicio-textos">
          <h1>
            IA para corregir exámenes <span className="highlight">de manera precisa y rápida</span>
          </h1>
          <p className="subtitle">
            Sube tus exámenes manuscritos, digitales o mixtos.<br />
            Nuestro LLM los corrige, puntúa e informa el rendimiento automáticamente.
          </p>
        </div>
        <div className="feature-cards">
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgEscaneo} alt="Escaneo" width="80" height="80" />
            </div>
            <h3>Escanea cualquier examen</h3>
            <p>Sube PDFs de cualquier examen, incluyendo manuscritos.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgCorreccion} alt="Corrección" width="80" height="80" />
            </div>
            <h3>Corrección inteligente</h3>
            <p>Aplica tus propios criterios de rúbrica para que nuestro LLM evalúe según tus indicaciones, justificando cada respuesta.</p>
          </div>
          <div className="feature-card">
            <div className="card-icon">
              <img src={imgInformes} alt="Informes" width="80" height="80" />
            </div>
            <h3>Obtén informes del progreso de tus alumnos</h3>
            <p>Descarga informes personalizados sobre la evaluación de los exámenes de tus alumnos.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
export default Inicio;
