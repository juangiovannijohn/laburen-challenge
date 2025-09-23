import config from '../../../config/config.js'; 
const route = 'products';
const url = `${config.API_URL}${route}`;

export const getProductByIdTool = {
  type: 'function',
  function: {
    name: 'getProductById',
    description:
      'Obtiene los detalles de un producto específico utilizando su ID numérico. Útil cuando el usuario pregunta por un producto por su ID o necesita más información sobre un producto ya listado.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'El ID numérico del producto a buscar.',
        },
      },
      required: ['id'],
    },
  },
};

export async function getProductById({ id }) {
  try {
    console.log('[ENDPOINT]: getProductById', `${url}/${id}`);
    const response = await fetch(`${url}/${id}`);
    const data = await response.json();
    console.log('[DATA]: getProductById', data);
    if (!response.ok) {
      return `Error: La API de productos devolvió un error: ${data.error || response.statusText}`;
    }

    return JSON.stringify(data);
  } catch (error) {
    return `Error: No se pudo conectar con la API de productos. Detalles: ${error.message}`;
  }
}
