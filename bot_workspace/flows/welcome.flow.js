import { addKeyword } from '@builderbot/bot';

const waitT = (ms) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms)
        }, ms)
    })
}

const welcomeFlow = addKeyword(['hola', 'buenas', 'hey', 'buenos dias', 'buenas tardes'])
    .addAction(async(ctx, { flowDynamic }) => {
        console.log(`[USER]: welcomeFlow activado. Mensaje: "${ctx.body}"`);
        await flowDynamic('¡Hola! 👋 Bienvenido a la tienda virtual.');
        await waitT(1000);
        await flowDynamic('Escribe lo que estás buscando y te ayudaré a encontrarlo. Por ejemplo: *"busco una camiseta"* o *"qué chaquetas tienes?"*.'
)
    })

export { welcomeFlow };
