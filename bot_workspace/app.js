import 'dotenv/config';
import { createBot, createProvider, createFlow } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import SupabaseDB from '../database/supabase.adapter.js';
import SessionSyncService from '../database/services/session-sync.js';
import { mainFlow } from './flows/main.flow.js';
import { configFlow } from './flows/config.flow.js';
import { agentFlow } from './flows/agent.flow.js';
import { initializeBotState } from './flows/config.flow.js';

const PORT = process.env.BOT_PORT || 3002;

const main = async () => {
  try {
    // Inicializar el estado del bot desde la base de datos al arrancar
    console.log('[APP]: Inicializando estado del bot...');
    await initializeBotState();
    console.log('[APP]: Estado del bot inicializado correctamente');

    const adapterDB = new SupabaseDB();

    // Inicializar servicio de sincronización de sesiones
    console.log('[DEBUG]: Inicializando sincronización de sesiones con Supabase...');
    const sessionSync = new SessionSyncService(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Inicializar el servicio y verificar auto-restauración
    try {
      await sessionSync.init();
      console.log('[SessionSync]: ✅ Servicio inicializado correctamente');
      
      // Verificar y restaurar archivos de sesión si es necesario
      console.log('[SessionSync]: 🔍 Verificando archivos de sesión...');
      await sessionSync.checkAndAutoRestore();
      
    } catch (error) {
      console.warn('[DEBUG]: Sincronización de sesiones no disponible:', error.message);
    }

    const adapterFlow = createFlow([mainFlow, configFlow, agentFlow]);
    
    // Usar autenticación local estándar de BuilderBot
    console.log('[DEBUG]: Configurando autenticación local...');
    const adapterProvider = createProvider(BaileysProvider);

    // Manejar eventos de conexión y errores
    adapterProvider.on('ready', async () => {
      console.log('[LOG]: ¡Conexión exitosa con WhatsApp!');
      console.log('[LOG]: Ya puedes enviar mensajes.');
      
      // Realizar backup de archivos de sesión después de conexión exitosa
      try {
        console.log('[SessionSync]: 💾 Realizando backup después de conexión exitosa...');
        await sessionSync.backupAllFiles();
        console.log('[SessionSync]: ✅ Backup completado después de conexión');
      } catch (error) {
        console.warn('[SessionSync]: ⚠️ Error al realizar backup después de conexión:', error.message);
      }
    });

    adapterProvider.on('auth_failure', (error) => {
      console.error('⚡⚡ ERROR DE AUTENTICACIÓN ⚡⚡');
      console.error('Detalles del error:', error);
      console.error('Posibles causas:');
      console.error('1. Problema con la carpeta bot_sessions');
      console.error('2. Permisos de escritura en el directorio');
      console.error('3. Archivos de sesión corruptos');
    });

    adapterProvider.on('qr', (qr) => {
      console.log('[LOG]: Código QR generado. Escanéalo con WhatsApp.');
    });

    adapterProvider.on('message', async (message) => {
      console.log('[DEBUG]: Mensaje recibido:', message.body);
      
      // Detectar mensajes undefined (causados por errores Bad MAC)
      if (message.body === undefined && message.from) {
        console.log('[SessionSync]: 🚨 Mensaje undefined detectado (posible Bad MAC), enviando mensaje de error');
        return; // No procesar más este mensaje
      }
    });

    const { handleCtx, httpServer } = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });

    // Capturar errores no manejados del proveedor (después de crear el bot)
    adapterProvider.on('error', async (error) => {
      console.error('⚡⚡ ERROR DEL PROVEEDOR ⚡⚡');
      console.error('Error completo:', error);
    });

    httpServer(+PORT);
    console.log(`[LOG]: Servidor del bot iniciado en el puerto ${PORT}.`);
    console.log('[LOG]: Esperando la conexión con WhatsApp...');
  } catch (error) {
    console.error('⚡⚡ ERROR EN MAIN ⚡⚡');
    console.error('Error completo:', error);
    console.error('Stack trace:', error.stack);
    
    // Verificar si es un error relacionado con archivos locales
    if (error.message && (error.message.includes('ENOENT') || error.message.includes('permission'))) {
      console.error('\n🔧 SOLUCIÓN REQUERIDA:');
      console.error('Problema con archivos de sesión local:');
      console.error('1. Verifica que el directorio tenga permisos de escritura');
      console.error('2. Elimina la carpeta bot_sessions si existe');
      console.error('3. Reinicia el bot para generar nuevas credenciales');
    }
    
    process.exit(1);
  }
};

main();
