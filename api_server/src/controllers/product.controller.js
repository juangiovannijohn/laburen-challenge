import { getProductsData, getProductByIdData, getProductContextData } from '../services/product.service.js';

export const getProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const products = await getProductsData(q);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductByIdData(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductsContext = async (req, res) => {
  try {
    const contextData = await getProductContextData();
    res.status(200).json(contextData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
