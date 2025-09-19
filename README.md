# Proyecto: Agente de Ventas con IA para Laburen.com

## 1. Objetivo Principal del Proyecto

El objetivo es diseñar, desarrollar y desplegar un agente de IA conversacional capaz de vender productos. El agente interactuará con los usuarios a través de WhatsApp, entenderá sus peticiones en lenguaje natural y utilizará una API REST propia para consultar productos y gestionar un carrito de compras. La información de los productos y carritos se persistirá en una base de datos PostgreSQL.

---

## 2. Desafío Técnico Original

<details>
<summary>Haz clic para ver el enunciado completo del desafío</summary>

### Desafío Técnico · Customer Success Engineer para **Laburen.com**

Diseña y demuestra, de punta a punta, cómo un agente de IA puede vender productos mediante una API propia y una base de datos en PostgreSQL. El reto se divide en una **fase conceptual** (soft) y una **fase práctica** (técnica). Todo el material debe ser 100 % ejecutable.

IMPORTANTE: No se busca un BOT (serie de menues en un chat), se espera un agente de IA capaz de ejecutar solicitudes HTTP.

---

#### 1. Fase Conceptual · Diseño del Agente de IA
1.  **Mapa de flujo**
    *   Ilustra (diagrama de flujo o secuencia) cómo el agente atiende a un cliente que:
        1.  explora productos,
        2.  crea un carrito
        3.  (extra) edita el carrito si el usuario lo pide.
2.  **Arquitectura de alto nivel**
    *   Componentes principales: LLM, API REST, base de datos, servicios externos (Whatsapp).

> **Formato de entrega:** PDF o Markdown de máx. 2 páginas con los endpoints + diagrama de flujo de interacción del agente.

---

#### 2. Fase Práctica · API & Base de Datos
##### 2.1 Fuente de datos
Se proveerá un archivo `products.xlsx` con N filas. Cada fila representa un producto.

##### 2.2 Base de datos
Crea el esquema mínimo siguiente (puedes ampliarlo):

| Tabla | Campos clave | Notas |
|---|---|---|
| `products` | `id` (PK), `name`, `description`, `price`, `stock` | |
| `carts` | `id` (PK), `created_at`, `updated_at` | Un carrito por conversación. |
| `cart_items` | `id` (PK), `cart_id` (FK), `product_id` (FK), `qty` | |

##### 2.3 Endpoints requeridos
| Método | Ruta | Descripción | Códigos HTTP |
|---|---|---|---|
| **GET** | `/products` | Lista con filtro opcional `?q=` por nombre/descr. | 200, 500 |
| **GET** | `/products/:id` | Detalle de un producto | 200, 404 |
| **POST** | `/carts` | Crea un carrito y añade ítems. Body: `{ items:[{product_id, qty}] }` | 201, 404 |
| **PATCH** | `/carts/:id` | **(Extra)** Actualiza cantidades o elimina ítems. Body: `{ items:[{product_id, qty}] }` | 200, 404 |

**Requisitos técnicos**

*   Node.js ≥ 18 o Python ≥ 3.10.
*   ORM permitido (Sequelize, Prisma, SQLAlchemy, etc.) o SQL puro.
*   Sin autenticación ni manejo de usuarios.
*   Variables sensibles en `.env`.

---

#### 3. Fase Práctica · Integración del Agente
1.  **LLM / framework libre** (OpenAI Functions, LangChain, etc.) podes usar gemini de google que su api tiene una capa gratis.
2.  El agente debe:
    *   Mostrar productos (consume `GET /products`).
    *   Crear un carrito (consume `POST /carts`) al recibir intención de compra.
    *   **(Extra)** Editar un carrito (consume `PATCH /carts/:id`).
3.  Interface: desplegar en un numero de test de Whatsapp API.

---

#### 4. Entregables
| Nº | Elemento | Forma |
|---|---|---|
| 1 | Repositorio GitHub | Código |
| 2 | Diagrama(s) & documento conceptual | Carpeta `/docs` |
| 3 | Numero del agente desplegado y consumiendo la API | Whatsapp |

</details>

---

## 3. Arquitectura y Estructura de Carpetas

El proyecto se divide en dos componentes principales: `api_server` y `bot_workspace`, que conviven en un monorepo.

```
/desafio-laburen/
├── 📄 .env                  # Variables de entorno (claves de APIs, config de DB, etc.)
├── 📄 .gitignore
├── 📄 package.json           # Dependencias y scripts del proyecto (Node.js)
├── 📄 README.md               # Este mismo documento
│
├── 📁 api_server/            # Componente 1: API REST y lógica de negocio
│   ├── 📁 src/
│   │   ├── 📁 config/        # Configuración de conexión a la base de datos (PostgreSQL)
│   │   ├── 📁 controllers/   # Lógica que maneja las peticiones y respuestas HTTP
│   │   ├── 📁 models/        # Esquemas/modelos de la base de datos (ORM - Sequelize/Prisma)
│   │   ├── 📁 routes/        # Definición de los endpoints de la API
│   │   └── 📁 scripts/       # Scripts utilitarios, como el `seed` para poblar la DB desde .xlsx
│   └── index.js            # Punto de entrada para iniciar el servidor Express
│
├── 📁 bot_workspace/          # Componente 2: Orquestador de chat y motor de IA
│   ├── 📁 flows/             # Flujos de conversación de Builderbot
│   │   ├── welcome.flow.js   # Flujo para interacciones simples (saludos, despedidas)
│   │   └── agent.flow.js     # Flujo que delega las conversaciones complejas al motor de IA
│   │
│   ├── 📁 ai_engine/          # Motor de Inteligencia Artificial
│   │   ├── 📁 llm/           # Responsabilidad: Conectarse al proveedor del LLM
│   │   │   └── client.js     # Configura y exporta el cliente del LLM (OpenAI, Gemini)
│   │   ├── 📁 prompts/        # Responsabilidad: Gestionar los prompts
│   │   │   └── system_prompt.js # Define la personalidad, instrucciones y rol del agente
│   │   ├── 📁 tools/          # Responsabilidad: Herramientas que la IA puede ejecutar
│   │   │   ├── index.js      # Agrupa y exporta todas las herramientas
│   │   │   ├── getProducts.js # Herramienta para llamar a GET /products
│   │   │   └── createCart.js # Herramienta para llamar a POST /carts
│   │   ├── 📁 history/        # Responsabilidad: Manejar el historial de la conversación
│   │   │   └── memory.js     # Abstrae el almacenamiento y recuperación del historial
│   │   └── agent_executor.js # Orquestador que une LLM, prompts y tools para ejecutar la lógica
│   │
│   ├── 📄 app.js             # Punto de entrada: Configuración e inicio de Builderbot
│   └── 📄 database.js         # Configuración de la DB para el estado interno de Builderbot
│
└── 📁 docs/                   # Documentación conceptual (diagramas, etc.)
    ├── arquitectura.md
    └── diagrama_flujo.png
```

---

## 4. Descripción Detallada de Componentes

### `api_server`
-   **Responsabilidad:** Servir una API RESTful para gestionar productos y carritos. Es el backend puro y no tiene conocimiento sobre la IA.
-   **Instrucciones Clave:**
    -   **`index.js`**: Debe inicializar una aplicación Express, aplicar middlewares (como `cors`, `json`), cargar las rutas de `routes/` y levantar el servidor en un puerto definido en `.env`.
    -   **`config/`**: Debe exportar la configuración de conexión a la base de datos PostgreSQL, leyendo los parámetros desde `.env`.
    -   **`models/`**: Deben definirse los modelos (`Product`, `Cart`, `CartItem`) usando un ORM como Sequelize, correspondiendo a las tablas de la base de datos. Deben incluirse las relaciones (FKs).
    -   **`controllers/`**: Deben contener las funciones de lógica de negocio (ej: `listProducts`, `createCart`). Estas funciones interactúan con los modelos para consultar o modificar la base de datos.
    -   **`routes/`**: Deben definir los endpoints (`/products`, `/carts`, etc.) y asociarlos a las funciones controladoras correspondientes.
    -   **`scripts/seed.js`**: Debe ser un script ejecutable que lea el archivo `products.xlsx` y utilice los modelos del ORM para poblar la tabla `products` en la base de datos.

### `bot_workspace`
-   **Responsabilidad:** Actuar como la interfaz conversacional con el usuario a través de WhatsApp y orquestar la lógica de IA.
-   **Tecnologías Clave Especificadas:**
       - **Framework**: builderbot
       - **Proveedor WhatsApp**: BaileysProvider (del paquete @builderbot/provider-baileys).
       - **Adaptador de Base de Datos y Memoria**: JsonFileAdapter (del paquete @builderbot/database-json).

-   **Instrucciones Clave:**
    - **Gestión de Sesión (Baileys)**: La implementación de BaileysProvider debe incluir la lógica para guardar y reutilizar un archivo de sesión (ej: en una carpeta auth_info_baileys/). Esto es crucial para que el bot se reconecte automáticamente sin necesidad de escanear un nuevo código QR en cada reinicio. El LLM debe generar este código de manejo de sesión.
    -   **`app.js`**: Punto de entrada principal. Debe inicializar `builderbot` con sus adaptadores (WhatsApp, Base de datos) y cargar los flujos definidos en la carpeta `flows/`.
    -   **`flows/welcome.flow.js`**: Debe manejar interacciones simples y predecibles sin usar el LLM, como saludos o despedidas, para optimizar costos y velocidad.
    -   **`flows/agent.flow.js`**: Debe activarse ante cualquier entrada que no sea manejada por otros flujos. Su única responsabilidad es tomar el texto del usuario y pasárselo a la función principal del `ai_engine/agent_executor.js`. Luego, debe tomar la respuesta y enviarla al usuario.
    -   **`ai_engine/`**: Este es el cerebro.
        -   **`llm/client.js`**: Debe inicializar y exportar una única instancia del cliente del LLM (ej. `new OpenAI(...)`) usando la API Key de `.env`.
        -   **`prompts/system_prompt.js`**: Debe exportar un string o plantilla de string con las instrucciones maestras para el agente. Ejemplo: "Eres un asistente de ventas amigable para Laburen.com. Tu objetivo es ayudar a los usuarios a encontrar y comprar productos. Solo puedes usar las herramientas que se te proporcionan..." .
        -   **`tools/*.js`**: Cada archivo debe definir y exportar una herramienta que el LLM pueda usar. La herramienta debe tener un `name` y una `description` clara para que el LLM sepa cuándo usarla. La función `action` de la herramienta debe realizar una llamada `fetch` a la `api_server`.
        - **`history/memory.js`**: Este módulo ahora actúa como un wrapper o una capa de abstracción simple. Su función principal será obtener el historial del ctx (contexto de la conversación) que builderbot provee en cada interacción, en lugar de gestionar su propio almacenamiento.
        -   **`agent_executor.js`**: Es el orquestador. Debe importar todos los demás componentes del `ai_engine`. Debe crear el agente (usando un framework como LangChain o la API nativa del LLM) y exponer una función `runAgent(userInput, history)` que se encargue de todo el ciclo de `pensamiento -> herramienta -> respuesta` y devuelva el texto final.

---

## 5. Flujo de Ejecución

1.  El usuario envía un mensaje por WhatsApp.
2.  `builderbot` (`app.js`) lo recibe y lo dirige al flujo correspondiente.
3.  Para una consulta compleja, `agent.flow.js` se activa y llama a `runAgent()` en `agent_executor.js`.
4.  `agent_executor.js` combina el historial, el nuevo input del usuario y el prompt del sistema, y se lo pasa al LLM junto con la lista de herramientas disponibles.
5.  El LLM decide si necesita usar una herramienta (ej: `getProducts`). Si es así, el `agent_executor` ejecuta la herramienta correspondiente (`tools/getProducts.js`).
6.  La herramienta llama por HTTP al `api_server` (ej: `GET http://localhost:3000/products?q=remera`).
7.  El `api_server` consulta la base de datos y devuelve los datos en formato JSON.
8.  La herramienta recibe el JSON y se lo devuelve al LLM como una observación.
9.  El LLM, con la nueva información, formula una respuesta en lenguaje natural.
10. El `agent_executor` devuelve este texto al `agent.flow.js`.
11. `builderbot` envía la respuesta final al usuario por WhatsApp.

## 6. Guía de Implementación y Setup

### Paso 1: Crear la estructura de archivos y carpetas

Crear toda la estructura de directorios y archivos vacíos tal como se describe en la sección `3. Arquitectura y Estructura de Carpetas`.

### Paso 2: Crear el archivo de variables de entorno

Crear un archivo llamado `.env.example` en la raíz del proyecto con el siguiente contenido. Este archivo sirve como plantilla.

*Nota de Seguridad Importante:*

*   Crear un archivo `.gitignore` en la raíz del proyecto y asegurarse de que contenga la línea `.env` para evitar que las claves secretas se suban al repositorio.
*   El archivo `.env.example`, en cambio, **SÍ** debe ser incluido en el repositorio, ya que sirve como guía para otros desarrolladores.

```ini
# Archivo: .env.example
# Rellena estos valores y renombra el archivo a .env

# 1. CONFIGURACIÓN DEL API_SERVER
# ---------------------------------
# Puerto para la API REST
PORT=3001

# Credenciales de Supabase
SUPABASE_URL=https://<tu-id-de-proyecto>.supabase.co
SUPABASE_ANON_KEY=<tu-clave-publica-anon>
SUPABASE_SERVICE_KEY=<tu-clave-secreta-de-servicio>


# 2. CONFIGURACIÓN DEL BOT_WORKSPACE
# ---------------------------------
# Proveedor de LLM (opciones: 'openai', 'gemini')
LLM_PROVIDER=openai

# API Key de OpenAI
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Modelo de OpenAI a utilizar
LLM_MODEL_NAME=gpt-4-turbo

# (No se necesitan claves para Baileys, ya que funciona con un archivo de sesión)
```


### Paso 3: Instalar Dependencias

Para una mejor organización, instalaremos las dependencias por separado para cada parte del proyecto y también agregaremos herramientas de desarrollo que facilitarán el trabajo.

*1. Dependencias del Servidor (`api_server`)*

Estas son necesarias para que la API REST funcione. Ejecuta el siguiente comando:

```bash
npm install express @supabase/supabase-js dotenv cors xlsx pg
```

*   `express`: Framework para crear el servidor web.
*   `@supabase/supabase-js`: Cliente oficial para interactuar con Supabase.
*   `dotenv`: Para cargar las variables de entorno desde el archivo `.env`.
*   `cors`: Para permitir peticiones desde otros orígenes (necesario para la comunicación bot -> api).
*   `xlsx`: Para leer el archivo `.xlsx` con los productos para el script de `seed`.
*   `pg`: Driver de PostgreSQL, a menudo una dependencia necesaria para clientes de bases de datos basadas en Postgres.

*2. Dependencias del Bot (`bot_workspace`)*

Estas son para el framework del chatbot, el proveedor de WhatsApp y el motor de IA.

```bash
npm install @builderbot/bot @builderbot/provider-baileys @builderbot/database-json @openai/openai
```

*   `@builderbot/bot`: Núcleo del framework Builderbot.
*   `@builderbot/provider-baileys`: Conector para WhatsApp usando Baileys.
*   `@builderbot/database-json`: Adaptador para usar un archivo JSON como base de datos y memoria.
*   `@openai/openai`: Cliente oficial para la API de OpenAI (o el que corresponda al LLM elegido).

*3. Dependencias de Desarrollo (`devDependencies`)*

Estas herramientas nos ayudarán a ejecutar y probar el proyecto más fácilmente. Se instalan con la bandera `-D` o `--save-dev`.

```bash
npm install nodemon concurrently --save-dev
```

*   `nodemon`: Reinicia el servidor automáticamente cuando detecta cambios en el código. Esencial para un desarrollo fluido.
*   `concurrently`: Permite ejecutar múltiples comandos a la vez, perfecto para iniciar `api_server` y `bot_workspace` simultáneamente.

*Sugerencia de Scripts para `package.json`*

Para aprovechar estas herramientas, se recomienda agregar los siguientes scripts a tu archivo `package.json`:

```json
"scripts": {
  "dev:api": "nodemon api_server/index.js",
  "dev:bot": "nodemon bot_workspace/app.js",
  "dev": "concurrently \"npm:dev:api\" \"npm:dev:bot\""
}
```

Con esta configuración, simplemente ejecutando `npm run dev` en tu terminal, se levantarán ambos servicios (`api_server` y `bot_workspace`) al mismo tiempo, y se reiniciarán automáticamente si haces cambios en su código).

### Paso 4: Implementar el código

Proceder a escribir el código para cada archivo, uno por uno, siguiendo estrictamente las responsabilidades, tecnologías y arquitecturas definidas en las secciones anteriores de este documento.


## 7. Manejo de Errores

Una aplicación robusta se define por cómo gestiona los fallos. Se debe implementar una estrategia de manejo de errores en ambos componentes del sistema.

### 7.1. En `api_server`

1.  **Errores de Cliente (4xx):** Para peticiones con datos incorrectos o que apuntan a recursos no existentes (ej: un ID de producto inválido), la API debe responder con un código de estado `4xx` apropiado y un cuerpo de respuesta JSON que describa el error. 
    *   *Ejemplo:* `res.status(404).json({ error: 'Producto no encontrado' })`.

2.  **Errores de Servidor (5xx):** Se debe implementar un *middleware* de manejo de errores global en Express. Este middleware se colocará al final de la cadena de middlewares y rutas. Su función es atrapar cualquier excepción no controlada, registrarla internamente (opcional) y devolver una respuesta genérica con estado `500` para no exponer detalles sensibles de la implementación.

### 7.2. En `bot_workspace`

1.  **Fallo en Herramientas (Tools):** La lógica dentro de cada herramienta (en `ai_engine/tools/`) que realiza llamadas `fetch` a la `api_server` debe estar envuelta en un bloque `try...catch`.
    *   Si la llamada falla (ej: la API está caída o devuelve un error 500), la herramienta **no debe fallar**. En su lugar, debe capturar la excepción y devolver al LLM una cadena de texto indicando el error. 
    *   *Ejemplo de retorno en caso de fallo:* `"Error: No se pudo obtener la lista de productos. El servidor no está disponible."`

2.  **Instrucción de Fallback en el Prompt:** El archivo `prompts/system_prompt.js` debe ser actualizado para incluir una instrucción clara sobre cómo actuar ante un error de una herramienta.
    *   **Instrucción sugerida:** *"Si una herramienta te devuelve un mensaje que comienza con 'Error:', tu tarea es no reintentar la herramienta. Debes informar al usuario de manera amigable que ha ocurrido un problema técnico y sugerirle que lo intente de nuevo en unos momentos. No debes inventar una respuesta ni exponer el mensaje de error técnico al usuario."*
