import {
  createCartData,
  updateCartData
} from '../services/cart.service.js';

// El controlador ahora solo maneja req/res y llama al servicio.
// La lógica de negocio y los errores específicos (ej. 404, 400) son manejados por el servicio.

export const createCart = async (req, res) => {
  try {
    const { items } = req.body;
    const newCart = await createCartData(items);
    res.status(201).json(newCart);
  } catch (error) {
    // Si es un error de negocio que definimos, usamos su status code.
    // Si no, es un error 500 genérico.
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const updatedCart = await updateCartData(id, items);
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};