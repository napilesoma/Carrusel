import {useEffect,useState} from 'react';
import axios from 'axios';

export default function Logros({grado,area,anio}){
  const [logros,setLogros]=useState([]);
  const [nuevo,setNuevo]=useState('');

  useEffect(()=>{
    axios.get(`http://localhost:3000/logros/${grado}/${area}/${anio}`,{
      headers:{Authorization:localStorage.getItem('token')}
    }).then(r=>setLogros(r.data));
  },[]);

  const add=()=>{
    axios.post('http://localhost:3000/logros',{
      grado_id:grado,area_id:area,descripcion:nuevo,anio
    },{headers:{Authorization:localStorage.getItem('token')}});
    setNuevo('');
  };

  return(
    <div>
      <h2 className="text-xl mb-2">Banco de logros</h2>
      {logros.map(l=>(<div key={l.id}><input type="checkbox"/> {l.descripcion}</div>))}
      <input placeholder="Agregar logro" onChange={e=>setNuevo(e.target.value)} className="border p-1"/>
      <button onClick={add} className="bg-green-500 text-white p-1 ml-2">Agregar</button>
    </div>
  )
}
