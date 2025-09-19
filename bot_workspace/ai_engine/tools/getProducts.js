const API_URL = `http://localhost:${process.env.API_PORT || 3000}`;

export const getProductsTool = {
  type: "function",
  function: {
    name: "getProducts",
    description: "Obtiene una lista de productos de la tienda, opcionalmente filtrados por una consulta de texto. Útil para cuando el usuario pregunta por productos, busca algo específico o quiere ver el catálogo.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "La consulta de texto para filtrar productos por nombre, tipo de prenda, talla, color, categoría o descripción (ej: 'camiseta roja', 'pantalones de deporte talla L'). Si el usuario no especifica una consulta, se puede dejar vacío para obtener todos los productos.",
        },
      },
      required: [],
    },
  },
};

export async function getProducts({ query = '' } = {}) {
  try {
    const response = await fetch(`${API_URL}/products?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      return `Error: La API de productos devolvió un error: ${data.error || response.statusText}`;
    }

    if (data.length === 0) {
      return "No se encontraron productos con esa descripción.";
    }

    const formattedData = data.map(p => ({
      id: p.id,
      name: p.name,
      talla: p.talla,
      color: p.color,
      price: p.price,
      stock: p.stock,
      disponible: p.disponible ? 'Sí' : 'No',
      categoria: p.categoria
    }));

    return JSON.stringify(formattedData);

  } catch (error) {
    return `Error: No se pudo conectar con la API de productos. Detalles: ${error.message}`;
  }
}
