import dotenv from 'dotenv';
import { createBot, createProvider, createFlow } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { JsonFileDB } from '@builderbot/database-json';
import { welcomeFlow } from './flows/welcome.flow.js';
import { agentFlow } from './flows/agent.flow.js';

dotenv.config();


const PORT = process.env.BOT_PORT || 3001;

const main = async () => {

    const adapterDB = new JsonFileDB({ filename: 'db.json' })

    const adapterFlow = createFlow([welcomeFlow, agentFlow]);
    const adapterProvider = createProvider(BaileysProvider);

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    adapterProvider.on('ready', () => {
        console.log('[LOG]: ¡Conexión exitosa con WhatsApp!');
        console.log('[LOG]: Ya puedes enviar mensajes.');
    });

    httpServer(+PORT);
    console.log(`[LOG]: Servidor del bot iniciado en el puerto ${PORT}.`);
    console.log('[LOG]: Esperando la conexión con WhatsApp...');
};

main();
