import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

class SessionSyncService {
  constructor(supabaseUrl, supabaseKey, bucketName = 'whatsapp-sessions') {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.bucketName = bucketName;
    this.sessionDir = path.join(process.cwd(), 'bot_sessions');
    this.syncInterval = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('[SessionSync]: Inicializando servicio de sincronización...');
      
      // Verificar que el bucket existe
      const { data: buckets, error: bucketsError } = await this.supabase.storage.listBuckets();
      if (bucketsError) throw bucketsError;

      const bucketExists = buckets.some(bucket => bucket.name === this.bucketName);
      if (!bucketExists) {
        console.log(`[SessionSync]: Creando bucket ${this.bucketName}...`);
        const { error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 1024 * 1024 // 1MB
        });
        if (createError) throw createError;
      }

      this.isInitialized = true;
      console.log('[SessionSync]: ✅ Servicio inicializado correctamente');
      
      // No hacer backup automático en la inicialización
      // Solo se hará backup si se restauran archivos desde Supabase
      
    } catch (error) {
      console.error('[SessionSync]: ❌ Error al inicializar:', error.message);
      this.isInitialized = false;
    }
  }

  async backupAllFiles() {
    if (!this.isInitialized) return;

    try {
      // Verificar que la carpeta bot_sessions existe
      const sessionDirExists = await fs.access(this.sessionDir).then(() => true).catch(() => false);
      if (!sessionDirExists) {
        console.log('[SessionSync]: Carpeta bot_sessions no existe aún');
        return;
      }

      const files = await fs.readdir(this.sessionDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      if (jsonFiles.length === 0) {
        console.log('[SessionSync]: No hay archivos de sesión para respaldar');
        return;
      }

      console.log(`[SessionSync]: Respaldando ${jsonFiles.length} archivos...`);

      for (const file of jsonFiles) {
        await this.backupFile(file);
      }

      console.log('[SessionSync]: ✅ Backup completado');
    } catch (error) {
      console.error('[SessionSync]: ❌ Error en backup:', error.message);
    }
  }

  async backupFile(filename) {
    try {
      const filePath = path.join(this.sessionDir, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(`session-backup/${filename}`, fileContent, {
          contentType: 'application/json',
          upsert: true // Sobrescribir si existe
        });

      if (error) {
        console.error(`[SessionSync]: Error respaldando ${filename}:`, error.message);
      } else {
        console.log(`[SessionSync]: ✅ ${filename} respaldado`);
      }
    } catch (error) {
      console.error(`[SessionSync]: Error leyendo ${filename}:`, error.message);
    }
  }

  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log('[SessionSync]: Iniciando sincronización automática (cada 30s)');
    this.syncInterval = setInterval(async () => {
      await this.backupAllFiles();
    }, 300000); // 5 minutos
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[SessionSync]: Sincronización automática detenida');
    }
  }

  async restoreFromBackup() {
    if (!this.isInitialized) {
      console.error('[SessionSync]: Servicio no inicializado');
      return false;
    }

    try {
      console.log('[SessionSync]: Restaurando archivos desde Supabase...');
      
      // Listar archivos en el bucket
      const { data: files, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('session-backup');

      if (error) throw error;

      if (!files || files.length === 0) {
        console.log('[SessionSync]: No hay archivos de backup disponibles');
        return false;
      }

      // Crear directorio si no existe
      await fs.mkdir(this.sessionDir, { recursive: true });

      // Restaurar cada archivo
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          await this.restoreFile(file.name);
        }
      }

      console.log('[SessionSync]: ✅ Restauración completada');
      return true;
    } catch (error) {
      console.error('[SessionSync]: ❌ Error en restauración:', error.message);
      return false;
    }
  }

  async restoreFile(filename) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(`session-backup/${filename}`);

      if (error) throw error;

      const content = await data.text();
      const filePath = path.join(this.sessionDir, filename);
      
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`[SessionSync]: ✅ ${filename} restaurado`);
    } catch (error) {
      console.error(`[SessionSync]: Error restaurando ${filename}:`, error.message);
    }
  }

  async checkAndAutoRestore() {
    if (!this.isInitialized) {
      console.error('[SessionSync]: Servicio no inicializado para auto-restauración');
      return false;
    }

    try {
      // Verificar si existe el directorio de sesiones
      const dirExists = await fs.access(this.sessionDir).then(() => true).catch(() => false);
      
      if (!dirExists) {
        console.log('[SessionSync]: 📁 Directorio de sesiones no existe, creando...');
        await fs.mkdir(this.sessionDir, { recursive: true });
      }

      // Verificar si hay archivos de sesión
      const files = await fs.readdir(this.sessionDir).catch(() => []);
      const sessionFiles = files.filter(file => file.endsWith('.json'));

      if (sessionFiles.length === 0) {
        console.log('[SessionSync]: 🔍 No se encontraron archivos de sesión locales');
        console.log('[SessionSync]: 🔄 Intentando restaurar desde Supabase...');
        
        const restored = await this.restoreFromBackup();
        if (restored) {
          console.log('[SessionSync]: ✅ Auto-restauración completada exitosamente');
          // Hacer backup inmediato después de restaurar para sincronizar
          console.log('[SessionSync]: 📤 Realizando backup después de restauración...');
          await this.backupAllFiles();
          return true;
        } else {
          console.log('[SessionSync]: ℹ️  No hay backup disponible, se creará nueva sesión');
          return false;
        }
      } else {
        console.log(`[SessionSync]: ✅ Se encontraron ${sessionFiles.length} archivos de sesión locales`);
        return true;
      }
    } catch (error) {
      console.error('[SessionSync]: ❌ Error en auto-restauración:', error.message);
      return false;
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      autoSyncActive: this.syncInterval !== null,
      sessionDir: this.sessionDir,
      bucketName: this.bucketName
    };
  }
}

export default SessionSyncService;