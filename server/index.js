const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = 'CARRUSEL_SECRET';

function auth(roles=[]){
  return (req,res,next)=>{
    const token=req.headers.authorization;
    if(!token) return res.sendStatus(403);
    const data=jwt.verify(token,SECRET);
    if(roles.length && !roles.includes(data.rol)) return res.sendStatus(401);
    req.user=data;
    next();
  }
}

app.post('/login', async(req,res)=>{
  const {email,password}=req.body;
  const u = await pool.query('SELECT * FROM usuarios WHERE email=$1',[email]);
  if(!u.rows[0]) return res.sendStatus(401);
  if(!bcrypt.compareSync(password,u.rows[0].password)) return res.sendStatus(401);
  const token=jwt.sign({id:u.rows[0].id,rol:u.rows[0].rol},SECRET);
  res.json({token});
});

app.get('/estudiantes', auth(['docente']), async(req,res)=>{
  const r = await pool.query('SELECT * FROM estudiantes');
  res.json(r.rows);
});

app.post('/notas', auth(['docente']), async(req,res)=>{
  const {estudiante_id,area_id,periodo_id,nota,recuperacion,desempeno}=req.body;
  await pool.query(`INSERT INTO calificaciones(estudiante_id,area_id,periodo_id,nota,recuperacion,desempeño)
    VALUES($1,$2,$3,$4,$5,$6)`,
    [estudiante_id,area_id,periodo_id,nota,recuperacion,desempeno]);
  res.sendStatus(200);
});

app.listen(3000,()=>console.log('Servidor Carrusel activo'));
