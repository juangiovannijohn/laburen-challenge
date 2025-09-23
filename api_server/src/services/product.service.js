import supabase from '../../../database/supabase.js';
/**
 * Obtiene listas de valores únicos para nombres, categorías, colores y tallas de productos.
 * @returns {Promise<object>} Un objeto con arrays de valores únicos.
 */
export const getProductContextData = async () => {
  try {
    const [
      { data: names, error: nameError },
      { data: categories, error: categoryError },
      { data: colors, error: colorError },
      { data: sizes, error: sizeError },
    ] = await Promise.all([
      supabase.from('products').select('name'),
      supabase.from('products').select('categoria'),
      supabase.from('products').select('color'),
      supabase.from('products').select('talla'),
    ]);

    if (nameError || categoryError || colorError || sizeError) {
      throw nameError || categoryError || colorError || sizeError;
    }

    const uniqueNames = [...new Set(names.map((p) => p.name).filter(Boolean))];
    const uniqueCategories = [...new Set(categories.map((p) => p.categoria).filter(Boolean))];
    const uniqueColors = [...new Set(colors.map((p) => p.color).filter(Boolean))];
    const uniqueSizes = [...new Set(sizes.map((p) => p.talla).filter(Boolean))];

    return {
      names: uniqueNames,
      categories: uniqueCategories,
      colors: uniqueColors,
      sizes: uniqueSizes,
    };
  } catch (error) {
    throw new Error(`Error al obtener el contexto de productos: ${error.message}`);
  }
};

/**
 * Obtiene una lista de productos, con un filtro opcional.
 * @param {string} [filter=''] - El término de búsqueda para filtrar por nombre o descripción.
 * @returns {Promise<Array>} Un array de productos.
 */
export const getProductsData = async (filter = '') => {
  try {
    let query = supabase.from('products').select('*');
    if (filter) {
      query = query.or(`name.ilike.%${filter}%,description.ilike.%${filter}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Error al obtener los productos: ${error.message}`);
  }
};

/**
 * Obtiene un producto específico por su ID.
 * @param {number|string} id - El ID del producto a buscar.
 * @returns {Promise<object|null>} El objeto del producto o null si no se encuentra.
 */
export const getProductByIdData = async (id) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    throw new Error(`Error al obtener el producto por ID ${id}: ${error.message}`);
  }
};
