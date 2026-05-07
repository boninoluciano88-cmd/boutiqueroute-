# boutiqueroute-
api route 
const express = require('express');
const cors = require('cors');
const app = express();
 
app.use(cors());
app.use(express.json());
 
// Rutas
app.use('/api/clientes', require('./routes/clientes'));
app.use('/api/recorrido', require('./routes/recorrido'));
 
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'RouteAI Backend', version: '1.0.0' });
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚛 RouteAI Backend corriendo en http://localhost:${PORT}`);
  console.log(`   GET  /health                    → estado del servidor`);
  console.log(`   GET  /api/clientes              → todos los clientes fijos`);
  console.log(`   GET  /api/clientes/hoy          → clientes del día de hoy`);
  console.log(`   POST /api/clientes              → agregar cliente fijo`);
  console.log(`   PUT  /api/clientes/:id          → editar cliente fijo`);
  console.log(`   DELETE /api/clientes/:id        → eliminar cliente fijo`);
  console.log(`   POST /api/recorrido/generar     → generar recorrido del día\n`);
});
 
