const API_URL = `${process.env.API_BASE_URL}:${process.env.API_PORT}/` || 'http://localhost:3001/';
const route = '/carts';
const url = `${API_URL}${route}`;
export const updateCartTool = {
  type: 'function',
  function: {
    name: 'updateCart',
    description:
      'Actualiza un carrito de compras existente. Permite cambiar la cantidad de un producto o eliminarlo (estableciendo la cantidad en 0).',
    parameters: {
      type: 'object',
      properties: {
        cart_id: {
          type: 'integer',
          description: 'El ID numérico del carrito que se va a modificar.',
        },
        items: {
          type: 'array',
          description:
            "Un array de productos para actualizar en el carrito. Cada objeto debe tener 'product_id' y 'qty'. Si 'qty' es 0, el producto se eliminará.",
          items: {
            type: 'object',
            properties: {
              product_id: {
                type: 'integer',
                description: 'El ID del producto a actualizar.',
              },
              qty: {
                type: 'integer',
                description: 'La nueva cantidad del producto. Si es 0, el producto se elimina del carrito.',
              },
            },
            required: ['product_id', 'qty'],
          },
        },
      },
      required: ['cart_id', 'items'],
    },
  },
};

export async function updateCart({ cart_id, items }) {
  try {
    const response = await fetch(`${url}/${cart_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();

    if (!response.ok) {
      return `Error: La API de carritos devolvió un error: ${data.error || response.statusText}`;
    }

    return JSON.stringify(data);
  } catch (error) {
    return `Error: No se pudo conectar con la API de carritos. Detalles: ${error.message}`;
  }
}
