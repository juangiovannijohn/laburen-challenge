# 🤖 Agente de Ventas con IA para WhatsApp

Este proyecto implementa un agente conversacional de IA integrado con WhatsApp, diseñado para simular el proceso de venta de productos de un catálogo. El agente puede entender las peticiones de los usuarios en lenguaje natural, consultar productos, gestionar un carrito de compras y utilizar herramientas para interactuar con una API REST propia.

---

## ✨ Características Principales

- **Integración con WhatsApp:** El agente opera directamente sobre WhatsApp, utilizando `@builderbot/provider-baileys`.
- **Procesamiento de Lenguaje Natural (PLN):** Utiliza un LLM (configurable para OpenAI/Gemini) para entender y responder a las consultas de los usuarios.
- **Consulta de Productos:** Permite a los usuarios buscar productos del catálogo, ya sea de forma general o por descripciones específicas.
- **Gestión de Carrito de Compras:** El agente puede crear un carrito de compras, añadir productos y modificar las cantidades o eliminar ítems.
- **Arquitectura Desacoplada:** El proyecto está dividido en un `api_server` (la API REST) y un `bot_workspace` (el agente de IA), permitiendo que cada componente escale y se mantenga de forma independiente.

---

## 🛠️ Stack Tecnológico

- **Backend (API Server):** Node.js, Express.js
- **Base de Datos:** PostgreSQL (gestionado a través de Supabase)
- **Chatbot Framework:** Builderbot
- **Motor de IA:** OpenAI (configurable)
- **Conectividad WhatsApp:** Baileys

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue un enfoque de monorepo con dos componentes principales:

1.  **`api_server`**: Un servidor de Express que expone una API RESTful para toda la lógica de negocio. No tiene conocimiento sobre la IA y su única responsabilidad es gestionar los datos de productos y carritos.
2.  **`bot_workspace`**: El cerebro del agente. Se conecta a WhatsApp, gestiona los flujos de conversación y utiliza el motor de IA para interpretar la intención del usuario y ejecutar las herramientas correspondientes (que a su vez consumen la `api_server`).

### Arquitectura de la API (Patrón Controlador-Servicio)

La API sigue un patrón de diseño moderno para separar responsabilidades:

- **Rutas (`/routes`):** Definen los endpoints de la API (ej. `/products`, `/carts/:id`).
- **Controladores (`/controllers`):** Reciben las peticiones HTTP, validan entradas básicas y llaman a la capa de servicio. Su única función es manejar el ciclo de `request/response`.
- **Servicios (`/services`):** Contienen toda la lógica de negocio. Realizan las consultas a la base de datos y aplican las reglas necesarias (verificar stock, validar datos, etc.). Son reutilizables y pueden ser llamados desde cualquier parte del sistema.

```
[Petición HTTP] -> [Ruta] -> [Controlador] -> [Servicio] -> [Base de Datos]
```

---

## 🚀 Guía de Inicio Rápido

Sigue estos pasos para poner en marcha el proyecto.

### 1. Prerrequisitos

- Node.js (v18 o superior)
- npm
- Una cuenta de Supabase (para la base de datos PostgreSQL)
- Una API Key de OpenAI (o el LLM que prefieras)

### 2. Clonar el Repositorio

```bash
git clone https://github.com/juangiovannijohn/laburen-challenge.git
cd laburen-challenge
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto. Puedes copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

Luego, edita el archivo `.env` con tus propias credenciales:

```ini
# Configuración del API Server
PORT=3001
SUPABASE_URL=https://<tu-id-de-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-clave-publica-anon>

# Configuración del Bot Workspace
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL_NAME=gpt-4-turbo
```

### 4. Instalar Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para instalar todas las dependencias de ambos workspaces:

```bash
npm install
```

### 5. Configurar la Base de Datos

1.  Ve a tu proyecto de Supabase y abre el **SQL Editor**.
2.  Copia el contenido del archivo `setup/db_scripts/schema.sql` y ejecútalo para crear las tablas `products`, `carts` y `cart_items`.
3.  Para poblar la base de datos con productos de ejemplo, ejecuta el script de "seeding":

    ```bash
    npm run seed
    ```

### 6. Ejecutar el Proyecto

Usa el siguiente comando para iniciar tanto la API como el bot simultáneamente:

```bash
npm run dev
```

### 7. Conectar a WhatsApp

Una vez que el proyecto esté corriendo, el proveedor de WhatsApp (`@builderbot/provider-baileys`) levantará un pequeño servidor web para mostrar el código QR.

1.  Abre tu navegador y ve a la dirección `http://localhost:3000` (o el puerto que hayas configurado para el bot).
2.  Verás un **código QR** en la página.
3.  Abre WhatsApp en tu teléfono, ve a `Configuración > Dispositivos vinculados > Vincular un dispositivo` y escanea el código para conectar al agente.

---

## 📁 Estructura de Carpetas

```
/
├── 📄 .env                  # Variables de entorno (claves, etc.)
├── 📄 package.json           # Dependencias y scripts del proyecto
├── 📄 README.md               # Esta documentación
│
├── 📁 api_server/            # API REST y lógica de negocio
│   ├── 📁 src/
│   │   ├── 📁 config/        # Conexión a la base de datos (Supabase)
│   │   ├── 📁 controllers/   # Controladores (capa HTTP)
│   │   ├── 📁 services/      # Lógica de negocio (capa de servicio)
│   │   └── 📁 routes/        # Endpoints de la API
│   └── 📄 index.js           # Punto de entrada del servidor Express
│
├── 📁 bot_workspace/          # Orquestador de chat y motor de IA
│   ├── 📁 flows/             # Flujos de conversación de Builderbot
│   │   └── agent.flow.js     # Flujo que delega la conversación a la IA
│   ├── 📁 ai_engine/          # Motor de Inteligencia Artificial
│   │   ├── 📁 llm/           # Cliente del LLM (OpenAI, Gemini, etc.)
│   │   ├── 📁 prompts/       # Instrucciones para el agente (System Prompt)
│   │   ├── 📁 tools/         # Herramientas que la IA puede ejecutar
│   │   └── 📄 agent_executor.js # Orquestador que une LLM, prompts y tools
│   └── 📄 app.js             # Punto de entrada de Builderbot
│
└── 📁 setup/
    └── 📁 db_scripts/
        └── schema.sql      # Esquema de la base de datos
```

---

## 🌐 Endpoints de la API

| Método  | Ruta                | Descripción                                          |
| :------ | :------------------ | :--------------------------------------------------- |
| `GET`   | `/products`         | Lista productos. Acepta filtro `?q=texto`.           |
| `GET`   | `/products/:id`     | Obtiene el detalle de un producto por su ID.         |
| `GET`   | `/products/context` | Devuelve listas de nombres, categorías, etc. únicos. |
| `POST`  | `/carts`            | Crea un nuevo carrito con productos.                 |
| `PATCH` | `/carts/:id`        | Actualiza o elimina productos de un carrito.         |

### 🧪 Probar la API con Postman

Para facilitar las pruebas y la interacción con la API, se incluye una colección de Postman en el repositorio.

- **Archivo:** `postman/Challengue-Laburen.postman_collection.json`

Simplemente importa este archivo en tu cliente de Postman para tener todos los endpoints pre-configurados, incluyendo ejemplos de los cuerpos (`body`) necesarios para las peticiones `POST` y `PATCH`.
