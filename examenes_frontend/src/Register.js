import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("estudiante");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:8000/usuarios/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({nombre,
          email,
          password: contraseña,
          rol: "profesor" }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMsgSuccess("Registrado correctamente. Redirigiendo a iniciar sesión...");
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError(data.detail || data.mensaje || "Error en el registro");
      }
    } catch (e) {
      setError("Error de conexión con el servidor");
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <h2>Registro</h2>
      <form onSubmit={handleSubmit} className="register-form">
        <input 
          type="text" 
          placeholder="Nombre" 
          value={nombre} 
          onChange={e => setNombre(e.target.value)} 
          required 
        />
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
          value={contraseña} 
          onChange={e => setContraseña(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarme"}
        </button>
        {msgSuccess && <div className="success-message">{msgSuccess}</div>}
        {error && <div className="error-message">{error}</div>}
      </form>
      <p className="login-link">
        ¿Ya estás registrado?{" "}
        <span onClick={() => navigate("/login")}>
          Inicia sesión
        </span>
      </p>
    </div>
  );
}

export default Register;
