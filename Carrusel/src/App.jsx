import { useState } from 'react';
import Login from './Login';

function App() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={{ padding: 40 }}>
      <h1>Panel del Sistema Carrusel</h1>
      <p>Bienvenido {user.usuario}</p>
      <p>Rol: {user.rol}</p>
    </div>
  );
}

export default App;
