import config from '../../../config/config.js';
const route = 'carts';
const url = `${config.API_URL}${route}`;
export const createCartTool = {
  type: 'function',
  function: {
    name: 'createCart',
    description:
      'Crea un nuevo carrito de compras con los productos y cantidades especificadas. Útil cuando el usuario ha decidido qué productos quiere comprar y en qué cantidad. Requiere un array de objetos con product_id y qty.',
    parameters: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description:
            "Un array de objetos, donde cada objeto representa un producto a añadir al carrito. Cada objeto debe tener 'product_id' (el ID numérico del producto) y 'qty' (la cantidad entera a añadir).",
          items: {
            type: 'object',
            properties: {
              product_id: {
                type: 'integer',
                description: 'El ID numérico del producto a añadir al carrito.',
              },
              qty: {
                type: 'integer',
                description: 'La cantidad del producto a añadir.',
              },
            },
            required: ['product_id', 'qty'],
          },
        },
      },
      required: ['items'],
    },
  },
};

export async function createCart({ items }) {
  try {
    console.log('[ENDPOINT]: createCart', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    const data = await response.json();
    console.log('[DATA]: createCart', data);
    if (!response.ok) {
      return `Error: La API de carritos devolvió un error: ${data.error || response.statusText}`;
    }

    return JSON.stringify(data);
  } catch (error) {
    return `Error: No se pudo conectar con la API de carritos. Detalles: ${error.message}`;
  }
}
