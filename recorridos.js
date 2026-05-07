const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { generarRecorrido, obtenerDia } = require('../services/optimizador');

const DB_PATH = path.join(__dirname, '../data/clientes_fijos.json');

function leerDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// POST /api/recorrido/generar
// Body: { fecha, pedidos_variables (opcional), vehiculo (opcional) }
router.post('/generar', async (req, res) => {
  try {
    const { fecha, pedidos_variables = [], vehiculo: vehiculoCustom } = req.body;

    if (!fecha) {
      return res.status(400).json({ ok: false, error: 'El campo "fecha" es requerido (formato: YYYY-MM-DD)' });
    }

    const db = leerDB();
    const dia = obtenerDia(fecha);

    // Filtrar clientes fijos del día solicitado
    const entregas_fijas = db.clientes.filter(c =>
      c.dias.includes(dia) || c.dias.includes('todos')
    );

    if (entregas_fijas.length === 0 && pedidos_variables.length === 0) {
      return res.json({
        ok: true,
        mensaje: `No hay entregas ni pedidos para el ${dia} ${fecha}`,
        recorrido: [],
        no_asignados: [],
        resumen: { total_paradas: 0 }
      });
    }

    // Usar vehículo del request o el default de la DB
    const vehiculo = vehiculoCustom || db.vehiculo_default;

    console.log(`\n📅 Generando recorrido para ${dia} ${fecha}`);
    console.log(`   Entregas fijas: ${entregas_fijas.length}`);
    console.log(`   Pedidos variables: ${pedidos_variables.length}`);
    console.log(`   Llamando a Claude API...`);

    const resultado = await generarRecorrido({
      entregas_fijas,
      pedidos_variables,
      vehiculo,
      fecha
    });

    console.log(`   ✅ Recorrido generado: ${resultado.resumen?.total_paradas} paradas`);

    res.json({
      ok: true,
      fecha,
      dia,
      entregas_fijas_del_dia: entregas_fijas.length,
      pedidos_variables_recibidos: pedidos_variables.length,
      ...resultado
    });

  } catch (error) {
    console.error('❌ Error al generar recorrido:', error.message);

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        ok: false,
        error: 'El modelo devolvió una respuesta inválida. Intentá de nuevo.',
        detalle: error.message
      });
    }

    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/recorrido/preview/:fecha — ver qué clientes fijos hay ese día (sin llamar a Claude)
router.get('/preview/:fecha', (req, res) => {
  const db = leerDB();
  const { fecha } = req.params;
  const dia = obtenerDia(fecha);
  const clientes = db.clientes.filter(c =>
    c.dias.includes(dia) || c.dias.includes('todos')
  );
  res.json({
    ok: true,
    fecha,
    dia,
    total_fijas: clientes.length,
    clientes_fijos: clientes.map(c => ({
      id: c.id,
      nombre: c.nombre,
      ventana: `${c.ventana_horaria.desde} - ${c.ventana_horaria.hasta}`,
      direccion: c.direccion
    }))
  });
});

module.exports = router;
