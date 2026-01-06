import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const entrar = async () => {
    try {
      const r = await axios.post('http://localhost:3000/login', {
        usuario: email,
        clave
      });

      if (!r.data.ok) return setError("Usuario o contraseña incorrectos");
      onLogin(r.data.user);
    } catch (e) {
      setError("Servidor apagado");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Sistema Carrusel</h2>

      <input placeholder="Usuario" onChange={e => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Contraseña" onChange={e => setClave(e.target.value)} /><br /><br />

      <button onClick={entrar}>Ingresar</button>

      <p style={{ color: 'red' }}>{error}</p>
    </div>
  );
}
