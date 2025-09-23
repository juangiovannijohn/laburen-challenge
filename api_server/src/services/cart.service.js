import supabase from '../../../database/supabase.js';

export const createCartData = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('El campo "items" es requerido y debe ser un array con productos.');
  }

  const productIds = items.map((item) => item.product_id);
  const { data: productsInDB, error: productError } = await supabase
    .from('products')
    .select('id, stock')
    .in('id', productIds);

  if (productError) throw productError;

  const stockMap = productsInDB.reduce((acc, p) => {
    acc[p.id] = p.stock;
    return acc;
  }, {});

  for (const item of items) {
    if (!stockMap[item.product_id]) {
      throw new Error(`El producto con id ${item.product_id} no fue encontrado.`);
    }
    if (stockMap[item.product_id] < item.qty) {
      throw new Error(
        `Stock insuficiente para el producto con id ${item.product_id}. Disponible: ${stockMap[item.product_id]}, Solicitado: ${item.qty}`
      );
    }
  }

  const { data: cartData, error: cartError } = await supabase.from('carts').insert({}).select().single();

  if (cartError) throw cartError;

  const cartItemsToInsert = items.map((item) => ({
    cart_id: cartData.id,
    product_id: item.product_id,
    qty: item.qty,
  }));

  const { data: cartItemsData, error: cartItemsError } = await supabase
    .from('cart_items')
    .insert(cartItemsToInsert)
    .select();

  if (cartItemsError) throw cartItemsError;

  return { ...cartData, items: cartItemsData };
};

export const updateCartData = async (cartId, items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('El campo "items" es requerido y debe ser un array con productos para actualizar.');
  }

  const { data: existingCart, error: cartError } = await supabase.from('carts').select('id').eq('id', cartId).single();

  if (cartError || !existingCart) {
    throw new Error('Carrito no encontrado.');
  }

  for (const item of items) {
    const { product_id, qty } = item;

    if (typeof product_id !== 'number' || product_id <= 0 || typeof qty !== 'number' || qty < 0) {
      throw new Error(`Datos inválidos para product_id ${product_id} o qty ${qty}.`);
    }

    if (qty === 0) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId)
        .eq('product_id', product_id);

      if (deleteError) throw deleteError;
    } else if (qty > 0) {
      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert({ cart_id: cartId, product_id, qty }, { onConflict: ['cart_id', 'product_id'] });

      if (upsertError) throw upsertError;
    }
  }

  const { data: updatedCartItems, error: fetchError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId);

  if (fetchError) throw fetchError;

  return { id: cartId, items: updatedCartItems };
};
