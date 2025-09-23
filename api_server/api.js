import express from 'express';
import cors from 'cors';
import productRoutes from './src/routes/product.routes.js';
import cartRoutes from './src/routes/cart.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);
app.use('/carts', cartRoutes);

app.get('/', (req, res) => {
  res.send('API Server is running!');
});

export default app;
