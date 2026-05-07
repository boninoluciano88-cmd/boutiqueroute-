const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un optimizador de rutas de reparto para una empresa de logística en La Plata, Argentina.

Tu tarea es generar el recorrido más eficiente del día combinando:
1. ENTREGAS FIJAS: clientes con horarios y días acordados. Su ventana horaria es INVIOLABLE.
2. PEDIDOS VARIABLES: pedidos nuevos sin horario fijo. Se insertan en los huecos disponibles entre entregas fijas, priorizando proximidad geográfica.

ALGORITMO:
- Ordenar entregas fijas cronológicamente por hora de inicio de ventana.
- Calcular tiempo de viaje entre paradas usando velocidad promedio del vehículo.
- Para cada hueco entre fijas, insertar pedidos variables cercanos geográficamente si hay tiempo suficiente.
- Verificar capacidad del vehículo acumulando kg en cada inserción.
- Si un pedido variable no cabe (tiempo o capacidad), moverlo a "no_asignados" con motivo claro.

REGLAS:
- Responde ÚNICAMENTE con JSON válido. Sin texto previo, sin bloques de código, sin explicaciones.
- hora_llegada debe ser string "HH:MM".
- distancia_km y tiempo_min son estimaciones basadas en coordenadas y velocidad promedio.
- tipo puede ser solo "fija" o "variable".

ESTRUCTURA DE RESPUESTA (exacta, no modificar claves):
{
  "recorrido": [
    {
      "orden": 1,
      "id": "CF001",
      "nombre": "Nombre del cliente",
      "direccion": "Dirección completa",
      "lat": -34.92,
      "lng": -57.95,
      "tipo": "fija",
      "hora_llegada": "08:30",
      "ventana_horaria": "08:30-09:00",
      "distancia_desde_anterior_km": 3.2,
      "tiempo_desde_anterior_min": 6,
      "estado": "en horario"
    }
  ],
  "no_asignados": [
    {
      "id": "PV001",
      "nombre": "Nombre",
      "motivo": "Motivo claro por el que no se pudo incluir"
    }
  ],
  "resumen": {
    "total_paradas": 8,
    "distancia_total_km": 47.5,
    "hora_inicio": "08:00",
    "hora_fin_estimada": "16:30",
    "carga_total_kg": 380,
    "pedidos_variables_asignados": 2,
    "pedidos_variables_no_asignados": 1
  }
}`;

async function generarRecorrido({ entregas_fijas, pedidos_variables = [], vehiculo, fecha }) {
  const userMsg = `
FECHA: ${fecha}
DÍA: ${obtenerDia(fecha)}

VEHÍCULO:
${JSON.stringify(vehiculo, null, 2)}

ENTREGAS FIJAS DEL DÍA (${entregas_fijas.length} clientes):
${JSON.stringify(entregas_fijas, null, 2)}

PEDIDOS VARIABLES DEL DÍA (${pedidos_variables.length} pedidos):
${JSON.stringify(pedidos_variables, null, 2)}

Genera el recorrido optimizado.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }]
  });

  const texto = response.content[0].text.trim();

  // Limpiar por si el modelo agrega backticks
  const limpio = texto.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(limpio);
}

function obtenerDia(fechaStr) {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const fecha = new Date(fechaStr + 'T12:00:00'); // evitar problemas de timezone
  return dias[fecha.getDay()];
}

module.exports = { generarRecorrido, obtenerDia };
