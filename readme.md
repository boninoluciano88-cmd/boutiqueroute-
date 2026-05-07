[README.md](https://github.com/user-attachments/files/27494392/README.md)
# RouteAI Backend 🚛

Backend de optimización de recorridos de reparto usando Claude AI.

## Instalación

```bash
npm install
```

Crear archivo `.env` en la raíz:
```
ANTHROPIC_API_KEY=tu_api_key_aqui
PORT=3000
```

Iniciar:
```bash
npm start        # producción
npm run dev      # desarrollo (auto-restart)
```

---

## Endpoints

### Salud del servidor
```
GET /health
```

---

### Clientes fijos

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/clientes` | Todos los clientes |
| GET | `/api/clientes/hoy` | Clientes de hoy |
| GET | `/api/clientes/dia/:dia` | Clientes de un día (lunes, martes...) |
| GET | `/api/clientes/:id` | Un cliente por ID |
| POST | `/api/clientes` | Agregar cliente |
| PUT | `/api/clientes/:id` | Editar cliente |
| DELETE | `/api/clientes/:id` | Eliminar cliente |

**Agregar cliente — body:**
```json
{
  "nombre": "Almacén Nuevo",
  "direccion": "Calle 60 N°500, La Plata",
  "lat": -34.9270,
  "lng": -57.9540,
  "ventana_horaria": { "desde": "10:00", "hasta": "10:20" },
  "dias": ["lunes", "miercoles", "viernes"],
  "notas": ""
}
```

---

### Recorrido

#### Preview (sin IA) — ver clientes fijos de un día
```
GET /api/recorrido/preview/2024-01-15
```

#### Generar recorrido del día (llama a Claude)
```
POST /api/recorrido/generar
```

**Body mínimo (solo fijas):**
```json
{
  "fecha": "2024-01-15"
}
```

**Body completo (con pedidos variables):**
```json
{
  "fecha": "2024-01-15",
  "pedidos_variables": [
    {
      "id": "PV001",
      "nombre": "Almacén El Sol",
      "direccion": "Calle 13 N°780, La Plata",
      "lat": -34.9300,
      "lng": -57.9570,
      "volumen_kg": 40,
      "preferencia_horaria": "antes de las 12:00",
      "notas": ""
    }
  ]
}
```

**Respuesta:**
```json
{
  "ok": true,
  "fecha": "2024-01-15",
  "dia": "lunes",
  "recorrido": [
    {
      "orden": 1,
      "id": "CF001",
      "nombre": "Supermercado El Cruce",
      "direccion": "Av. 44 N°1250, La Plata",
      "lat": -34.9205,
      "lng": -57.9545,
      "tipo": "fija",
      "hora_llegada": "08:30",
      "ventana_horaria": "08:30-09:00",
      "distancia_desde_anterior_km": 2.8,
      "tiempo_desde_anterior_min": 5,
      "estado": "en horario"
    }
  ],
  "no_asignados": [],
  "resumen": {
    "total_paradas": 7,
    "distancia_total_km": 43.2,
    "hora_inicio": "08:00",
    "hora_fin_estimada": "15:45",
    "carga_total_kg": 320
  }
}
```

---

## Estructura del proyecto

```
routeai-backend/
├── server.js                  ← entrada principal
├── package.json
├── .env                       ← API key (no subir a git)
├── data/
│   └── clientes_fijos.json    ← base de datos de clientes
├── routes/
│   ├── clientes.js            ← CRUD de clientes
│   └── recorrido.js           ← generación de recorrido
└── services/
    └── optimizador.js         ← lógica de Claude API
```

## Agregar coordenadas a una dirección

Si no tenés lat/lng de un cliente, podés obtenerlas gratis en:
- https://www.latlong.net (ingresás la dirección)
- Google Maps → click derecho en el mapa → aparecen las coordenadas

Ejemplo La Plata: lat = -34.9XXX, lng = -57.9XXX
