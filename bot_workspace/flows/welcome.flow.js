import { addKeyword } from '@builderbot/bot';

const waitT = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms);
    }, ms);
  });
};

const welcomeFlow = addKeyword(['hola', 'buenas', 'hey', 'buenos dias', 'buenas tardes']).addAction(
  async (ctx, { flowDynamic }) => {
    console.log(`[USER]: welcomeFlow activado. Mensaje: "${ctx.body}"`);
    await flowDynamic('¡Hola! 👋 Bienvenido a la tienda virtual de Laburen.com');
    await waitT(1000);
    await flowDynamic(
      'Soy tu asistente de ventas. Puedo ayudarte a:\n\n' +
      '- **Buscar productos:** Encuentra lo que necesitas en nuestro catálogo, ya sea por nombre, tipo de prenda, talla, color o categoría.\n' +
      '- **Ver detalles de productos:** Si tienes el ID de un producto, puedo darte toda su información.\n' +
      '- **Gestionar tu carrito de compras:** Puedes crear un carrito, añadir productos, modificar cantidades o eliminar ítems.\n\n' +
      '¿En qué puedo ayudarte hoy?'
    );
  }
);

export { welcomeFlow };
