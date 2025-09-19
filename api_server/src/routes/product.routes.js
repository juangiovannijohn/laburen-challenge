import express from 'express';
import { getProducts, getProductById, getProductsContext } from '../controllers/product.controller.js';

const router = express.Router();

router.get('/context', getProductsContext);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;
