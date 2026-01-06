import {useState} from 'react';
import axios from 'axios';

export default function Observacion({estudiante,periodo}){
  const [texto,setTexto]=useState('');

  const save=()=>{
    axios.post('http://localhost:3000/observacion',{
      estudiante_id:estudiante,
      periodo_id:periodo,
      texto
    },{headers:{Authorization:localStorage.getItem('token')}});
  };

  return(
    <div>
      <textarea className="border w-full p-2" rows="4"
        onChange={e=>setTexto(e.target.value)}
        placeholder="Observación general del periodo">
      </textarea>
      <button onClick={save} className="bg-blue-600 text-white p-2 mt-2">Guardar</button>
    </div>
  );
}
