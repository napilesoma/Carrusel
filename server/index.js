const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🎠 CARRUSEL FUNCIONANDO CORRECTAMENTE');
});

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

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Carrusel</title>
        <style>
          body { font-family: Arial; text-align: center; margin-top: 80px; background:#f6f6ff; }
          h1 { color:#6a0dad; }
          button { padding:15px; font-size:18px; background:#6a0dad; color:white; border:none; border-radius:10px; }
        </style>
      </head>
      <body>
        <h1>🎠 Sistema Carrusel</h1>
        <p>El sistema está funcionando correctamente.</p>
        <p>Ahora puedes conectar el frontend.</p>
        <button>BIENVENIDOS</button>
      </body>
    </html>
  `);
});

app.listen(PORT, ()=>console.log('Servidor Carrusel activo en puerto', PORT));


app.get('/calificaciones/:periodo/:area', auth(['docente']), async(req,res)=>{
  const {periodo,area} = req.params;
  const r = await pool.query(`
    SELECT e.id,e.nombres,e.apellidos,c.nota,c.recuperacion,c.desempeño
    FROM estudiantes e
    LEFT JOIN calificaciones c
    ON e.id=c.estudiante_id AND c.periodo_id=$1 AND c.area_id=$2
  `,[periodo,area]);
  res.json(r.rows);
});

app.get('/logros/:grado/:area/:anio', auth(['docente']), async(req,res)=>{
  const {grado,area,anio}=req.params;
  const r = await pool.query(
    'SELECT * FROM logros WHERE grado_id=$1 AND area_id=$2 AND anio=$3',
    [grado,area,anio]
  );
  res.json(r.rows);
});

app.post('/logros', auth(['docente']), async(req,res)=>{
  const {grado_id,area_id,descripcion,anio}=req.body;
  await pool.query('INSERT INTO logros(grado_id,area_id,descripcion,anio) VALUES($1,$2,$3,$4)',
  [grado_id,area_id,descripcion,anio]);
  res.sendStatus(200);
});

app.post('/observacion', auth(['docente']), async(req,res)=>{
  const {estudiante_id,periodo_id,texto}=req.body;
  await pool.query(
    'INSERT INTO observaciones(estudiante_id,periodo_id,texto) VALUES($1,$2,$3)',
    [estudiante_id,periodo_id,texto]
  );
  res.sendStatus(200);
});

app.post('/asistencia', auth(['docente']), async(req,res)=>{
  const {estudiante_id,fecha,tipo}=req.body;
  await pool.query(
    'INSERT INTO asistencia(estudiante_id,fecha,tipo) VALUES($1,$2,$3)',
    [estudiante_id,fecha,tipo]
  );
  res.sendStatus(200);
});

const PdfPrinter = require('pdfmake');
const fs = require('fs');

const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
    bold: 'node_modules/pdfmake/fonts/Roboto-Medium.ttf'
  }
};

const printer = new PdfPrinter(fonts);

app.get('/boletin/:estudiante/:periodo', auth(['docente','directora']), async(req,res)=>{
  const {estudiante,periodo}=req.params;

  const est = await pool.query('SELECT * FROM estudiantes WHERE id=$1',[estudiante]);
  const notas = await pool.query(`
    SELECT a.nombre,c.nota,c.desempeño
    FROM calificaciones c JOIN areas a ON c.area_id=a.id
    WHERE c.estudiante_id=$1 AND c.periodo_id=$2`,[estudiante,periodo]);

  const doc = {
    content:[
      {text:'CENTRO EDUCATIVO CARRUSEL',style:'h'},
      `ESTUDIANTE: ${est.rows[0].nombres} ${est.rows[0].apellidos}`,
      {text:'\nCALIFICACIONES\n'},
      {
        table:{
          body:[
            ['AREA','NOTA','DESEMPEÑO'],
            ...notas.rows.map(n=>[n.nombre,n.nota,n.desempeño])
          ]
        }
      },
      {text:'\nFIRMA DOCENTE ____________________      FIRMA DIRECTORA ____________________'}
    ],
    styles:{h:{fontSize:16,bold:true,alignment:'center'}}
  };

  const pdf = printer.createPdfKitDocument(doc);
  const file = `boletines/${estudiante}_${periodo}.pdf`;
  pdf.pipe(fs.createWriteStream(file));
  pdf.end();
  res.download(file);
});

app.get('/certificado/matricula/:id/:anio', auth(['secretaria','directora']), async(req,res)=>{
  const {id,anio}=req.params;
  const est = await pool.query('SELECT * FROM estudiantes WHERE id=$1',[id]);
  const mat = await pool.query('SELECT * FROM matriculas WHERE estudiante_id=$1 AND anio=$2',[id,anio]);

  const doc={
    content:[
      {text:'CERTIFICADO DE MATRÍCULA',style:'h'},
      `Certificamos que ${est.rows[0].nombres} ${est.rows[0].apellidos}`,
      `Se encuentra matriculado en el año ${anio}`,
      `Grado: ${mat.rows[0].grado_id}`,
      '\nFirma Secretaria ____________________'
    ],
    styles:{h:{fontSize:16,bold:true,alignment:'center'}}
  };

  const pdf=printer.createPdfKitDocument(doc);
  const file=`certificados/matricula_${id}_${anio}.pdf`;
  pdf.pipe(fs.createWriteStream(file));
  pdf.end();
  res.download(file);
});

app.get('/certificado/notas/:id/:anio', auth(['directora','coordinador_academico']), async(req,res)=>{
  const notas = await pool.query(`
   SELECT a.nombre,c.nota,c.desempeño FROM calificaciones c JOIN areas a ON c.area_id=a.id
   WHERE c.estudiante_id=$1`,[req.params.id]);

  const doc={
    content:[
      {text:'CERTIFICADO DE NOTAS',style:'h'},
      ...notas.rows.map(n=>`${n.nombre}: ${n.nota} (${n.desempeño})`),
      '\nFirma Directora __________   Firma Coord. Académica __________'
    ],
    styles:{h:{fontSize:16,bold:true,alignment:'center'}}
  };
  const pdf=printer.createPdfKitDocument(doc);
  const file=`certificados/notas_${req.params.id}_${req.params.anio}.pdf`;
  pdf.pipe(fs.createWriteStream(file));
  pdf.end();
  res.download(file);
});

app.get('/certificado/convivencia/:id/:anio', auth(['directora','coordinador_convivencia']), async(req,res)=>{
  const est = await pool.query('SELECT * FROM estudiantes WHERE id=$1',[req.params.id]);

  const doc={
    content:[
      {text:'CERTIFICADO DE CONVIVENCIA',style:'h'},
      `${est.rows[0].nombres} ${est.rows[0].apellidos} presentó buen comportamiento durante ${req.params.anio}`,
      '\nFirma Directora __________   Firma Coord. Convivencia __________'
    ],
    styles:{h:{fontSize:16,bold:true,alignment:'center'}}
  };

  const pdf=printer.createPdfKitDocument(doc);
  const file=`certificados/convivencia_${req.params.id}_${req.params.anio}.pdf`;
  pdf.pipe(fs.createWriteStream(file));
  pdf.end();
  res.download(file);
});

app.get('/reportes/promedios', auth(['directora','coordinador']), async(req,res)=>{
  const r = await pool.query(`
    SELECT g.nombre, AVG(c.nota) promedio
    FROM calificaciones c
    JOIN matriculas m ON c.estudiante_id=m.estudiante_id
    JOIN grados g ON m.grado_id=g.id
    GROUP BY g.nombre`);
  res.json(r.rows);
});

app.get('/', (req, res) => {
  res.send(`
    <h1>BIENVENIDO A CARRUSEL</h1>
    <p>Tu sistema escolar ya funciona</p>
  `);
});

