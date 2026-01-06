import {useEffect,useState} from 'react';
import axios from 'axios';

export default function Calificaciones({periodo,area}){
  const [data,setData]=useState([]);

  useEffect(()=>{
    axios.get(`http://localhost:3000/calificaciones/${periodo}/${area}`,{
      headers:{Authorization:localStorage.getItem('token')}
    }).then(r=>setData(r.data));
  },[]);

  const save=(id,nota,rec)=>{
    axios.post('http://localhost:3000/notas',{
      estudiante_id:id,
      area_id:area,
      periodo_id:periodo,
      nota,recuperacion:rec,desempeno:''
    },{headers:{Authorization:localStorage.getItem('token')}});
  };

  const color=(n)=>{
    if(n<3) return 'bg-red-200';
    if(n<4) return 'bg-gray-200';
    if(n<4.5) return 'bg-purple-200';
    return 'bg-cyan-200';
  }

  return(
    <div>
      <h2 className="text-xl mb-2">Registro de notas</h2>
      <table className="w-full border">
        <thead><tr><th>Estudiante</th><th>Nota</th><th>Recup</th><th>Desempeño</th></tr></thead>
        <tbody>
          {data.map(e=>(
            <tr key={e.id} className={color(e.nota||0)}>
              <td>{e.nombres} {e.apellidos}</td>
              <td><input type="number" step="0.1" min="1" max="5" onBlur={ev=>save(e.id,ev.target.value,e.recuperacion)} /></td>
              <td><input type="number" step="0.1" min="1" max="5" /></td>
              <td>{e.desempeño}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
