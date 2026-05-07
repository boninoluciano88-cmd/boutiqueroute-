const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/clientes_fijos.json');

function leerDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function guardarDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const DIAS_MAP = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado'
};

// GET /api/clientes — todos los clientes
router.get('/', (req, res) => {
  const db = leerDB();
  res.json({ ok: true, total: db.clientes.length, clientes: db.clientes });
});

// GET /api/clientes/hoy — solo los del día de hoy
router.get('/hoy', (req, res) => {
  const db = leerDB();
  const hoy = DIAS_MAP[new Date().getDay()];
  const clientes = db.clientes.filter(c =>
    c.dias.includes(hoy) || c.dias.includes('todos')
  );
  res.json({ ok: true, dia: hoy, total: clientes.length, clientes });
});

// GET /api/clientes/dia/:dia — clientes de un día específico
router.get('/dia/:dia', (req, res) => {
  const db = leerDB();
  const dia = req.params.dia.toLowerCase();
  const diasValidos = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  if (!diasValidos.includes(dia)) {
    return res.status(400).json({ ok: false, error: `Día inválido. Usá uno de: ${diasValidos.join(', ')}` });
  }
  const clientes = db.clientes.filter(c =>
    c.dias.includes(dia) || c.dias.includes('todos')
  );
  res.json({ ok: true, dia, total: clientes.length, clientes });
});

// GET /api/clientes/:id — un cliente específico
router.get('/:id', (req, res) => {
  const db = leerDB();
  const cliente = db.clientes.find(c => c.id === req.params.id);
  if (!cliente) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });
  res.json({ ok: true, cliente });
});

// POST /api/clientes — agregar nuevo cliente fijo
router.post('/', (req, res) => {
  const { nombre, direccion, lat, lng, ventana_horaria, dias, notas } = req.body;

  if (!nombre || !direccion || !lat || !lng || !ventana_horaria || !dias) {
    return res.status(400).json({
      ok: false,
      error: 'Faltan campos requeridos: nombre, direccion, lat, lng, ventana_horaria, dias'
    });
  }

  const db = leerDB();

  // Generar ID único
  const maxId = db.clientes
    .map(c => parseInt(c.id.replace('CF', '')))
    .reduce((a, b) => Math.max(a, b), 0);
  const nuevoId = `CF${String(maxId + 1).padStart(3, '0')}`;

  const nuevoCliente = {
    id: nuevoId,
    nombre,
    direccion,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    ventana_horaria,
    dias,
    notas: notas || ''
  };

  db.clientes.push(nuevoCliente);
  guardarDB(db);

  res.status(201).json({ ok: true, mensaje: 'Cliente agregado', cliente: nuevoCliente });
});

// PUT /api/clientes/:id — editar cliente existente
router.put('/:id', (req, res) => {
  const db = leerDB();
  const idx = db.clientes.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });

  // Merge: solo actualizar los campos que se envían
  db.clientes[idx] = { ...db.clientes[idx], ...req.body, id: req.params.id };
  guardarDB(db);

  res.json({ ok: true, mensaje: 'Cliente actualizado', cliente: db.clientes[idx] });
});

// DELETE /api/clientes/:id — eliminar cliente
router.delete('/:id', (req, res) => {
  const db = leerDB();
  const idx = db.clientes.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'Cliente no encontrado' });

  const eliminado = db.clientes.splice(idx, 1)[0];
  guardarDB(db);

  res.json({ ok: true, mensaje: 'Cliente eliminado', cliente: eliminado });
});

module.exports = router;
