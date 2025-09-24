# Mapa de Flujo del Agente de IA

Este documento ilustra el flujo de interacción del agente de IA con un cliente, desde la exploración de productos hasta la gestión del carrito de compras.

## 1. Exploración de Productos

```mermaid
sequenceDiagram
    Actor Cliente
    participant Bot as Agente de IA
    participant API as API REST (Productos)

    Cliente->>Bot: "Hola, ¿qué productos tienes?" / "Busco camisetas rojas"
    Bot->>Bot: Procesa lenguaje natural (LLM)
    Bot->>Bot: Identifica intención: Buscar productos
    Bot->>API: GET /products?q=<consulta_cliente>
    API-->>Bot: Lista de productos (JSON)
    Bot->>Bot: Formatea respuesta de productos
    Bot->>Cliente: "Claro, aquí tienes algunas opciones: [Lista de productos]. ¿Hay algo más en lo que pueda ayudarte?"
    Note right of Cliente: El cliente puede seguir preguntando o pedir detalles de un producto.

    Cliente->>Bot: "Quiero saber más sobre el producto con ID 123"
    Bot->>Bot: Procesa lenguaje natural (LLM)
    Bot->>Bot: Identifica intención: Obtener detalle de producto
    Bot->>API: GET /products/123
    API-->>Bot: Detalles del producto (JSON)
    Bot->>Bot: Formatea respuesta de detalles
    Bot->>Cliente: "El producto X (ID 123) es una camiseta roja de algodón, precio $25.00, stock 10. ¿Te gustaría añadirlo al carrito?"
```

## 2. Creación de Carrito

```mermaid
sequenceDiagram
    Actor Cliente
    participant Bot as Agente de IA
    participant API as API REST (Carritos)

    Cliente->>Bot: "Sí, quiero añadir 2 unidades del producto ID 123 al carrito"
    Bot->>Bot: Procesa lenguaje natural (LLM)
    Bot->>Bot: Identifica intención: Crear/Añadir a carrito
    Bot->>API: POST /carts (Body: { items: [{ product_id: 123, qty: 2 }] })
    API-->>Bot: Carrito creado/actualizado (JSON)
    Bot->>Bot: Formatea respuesta de carrito
    Bot->>Cliente: "¡Perfecto! Se han añadido 2 unidades de la camiseta roja a tu carrito. Tu carrito ahora contiene: [Resumen del carrito]. ¿Deseas algo más?"
```

## 3. Edición de Carrito (Extra)

```mermaid
sequenceDiagram
    Actor Cliente
    participant Bot as Agente de IA
    participant API as API REST (Carritos)

    Cliente->>Bot: "Quiero cambiar la cantidad del producto ID 123 a 5" / "Quiero eliminar el producto ID 456 del carrito"
    Bot->>Bot: Procesa lenguaje natural (LLM)
    Bot->>Bot: Identifica intención: Actualizar/Eliminar de carrito
    Bot->>API: PATCH /carts/<cart_id> (Body: { items: [{ product_id: 123, qty: 5 }] } o [{ product_id: 456, qty: 0 }] )
    API-->>Bot: Carrito actualizado (JSON)
    Bot->>Bot: Formatea respuesta de carrito
    Bot->>Cliente: "Listo, tu carrito ha sido actualizado. Ahora contiene: [Resumen del carrito]."
```
