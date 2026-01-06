import axios from 'axios';

export default function Asistencia({lista}){
  const marcar=(id,tipo)=>{
    axios.post('http://localhost:3000/asistencia',{
      estudiante_id:id,
      fecha:new Date(),
      tipo
    },{headers:{Authorization:localStorage.getItem('token')}});
  };

  return(
    <div>
      <h2 className="text-xl">Asistencia</h2>
      {lista.map(e=>(
        <div key={e.id} className="flex gap-2">
          {e.nombres}
          <button onClick={()=>marcar(e.id,'PRESENTE')}>✔</button>
          <button onClick={()=>marcar(e.id,'RETARDO')}>⏰</button>
          <button onClick={()=>marcar(e.id,'FALTA')}>❌</button>
        </div>
      ))}
    </div>
  )
}
