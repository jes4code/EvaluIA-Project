import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail || "Error en usuario o contraseña");
        setLoading(false);
        return;
      }
      const data = await resp.json();
      onLogin(data.usuario);

      if (data.usuario.rol === "profesor") {
        navigate("/profesor-dashboard", { replace: true });
      } else if (data.usuario.rol === "estudiante") {
        navigate("/estudiante-dashboard", { replace: true });
      } else {
        navigate("/inicio", { replace: true });
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
    setLoading(false);
  };

  return (
    <main className="main-content">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Iniciar sesión</h2>
        <div className="inputs">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Conectando..." : "Entrar"}
        </button>
        <p className="register-text">
          ¿Aún no estás registrado?{" "}
          <span onClick={() => navigate("/register")}>
            Regístrate
          </span>
        </p>
      </form>
    </main>
  );
}

export default Login;
