import express from 'express';
import { createCart, updateCart } from '../controllers/cart.controller.js';

const router = express.Router();

router.post('/', createCart);
router.patch('/:id', updateCart);

export default router;
