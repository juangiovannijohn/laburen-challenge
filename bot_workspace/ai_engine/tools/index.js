import { getProductsTool, getProducts } from './getProducts.js';
import { createCartTool, createCart } from './createCart.js';
import { getProductByIdTool, getProductById } from './getProductById.js';
import { updateCartTool, updateCart } from './updateCart.js'; // Importar la nueva herramienta

// Añadir la definición de la nueva herramienta para que el LLM la conozca
export const toolsDefinitions = [getProductsTool, createCartTool, getProductByIdTool, updateCartTool];

// Añadir la implementación de la nueva herramienta para que el agente pueda ejecutarla
export const toolsImplementations = {
  getProducts,
  createCart,
  getProductById,
  updateCart,
};
