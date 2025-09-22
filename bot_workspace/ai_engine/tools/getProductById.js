const API_URL = `http://localhost:${process.env.API_PORT || 3000}`;

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
    const response = await fetch(`${API_URL}/products/${id}`);
    const data = await response.json();

    if (!response.ok) {
      return `Error: La API de productos devolvió un error: ${data.error || response.statusText}`;
    }

    return JSON.stringify(data);
  } catch (error) {
    return `Error: No se pudo conectar con la API de productos. Detalles: ${error.message}`;
  }
}
