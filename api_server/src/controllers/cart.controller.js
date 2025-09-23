import { createCartData, updateCartData } from '../services/cart.service.js';

export const createCart = async (req, res) => {
  try {
    const { items } = req.body;
    const newCart = await createCartData(items);
    res.status(201).json(newCart);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const updatedCart = await updateCartData(id, items);
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};
