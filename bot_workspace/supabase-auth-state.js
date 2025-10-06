import { createClient } from '@supabase/supabase-js'
import { initAuthCreds } from 'baileys'

/**
 * Adaptador personalizado para usar Supabase Storage como backend para el estado de autenticación de Baileys
 * Reemplaza el comportamiento de useMultiFileAuthState para usar Supabase en lugar del sistema de archivos
 */
class SupabaseAuthState {
    constructor(supabaseUrl, supabaseKey, bucketName = 'whatsapp-sessions', sessionId = 'default') {
        this.supabase = createClient(supabaseUrl, supabaseKey)
        this.bucketName = bucketName
        this.sessionId = sessionId
        this.state = {
            creds: null,
            keys: {}
        }
    }

    /**
     * Inicializa el estado de autenticación
     */
    async init() {
        try {
            console.log('[DEBUG]: Verificando bucket en Supabase Storage...');
            await this.ensureBucketExists()
            
            // Cargar credenciales existentes o crear nuevas
            console.log('[DEBUG]: Cargando credenciales...');
            this.state.creds = await this.loadCreds()
            
            // Cargar claves existentes
            console.log('[DEBUG]: Cargando claves...');
            this.state.keys = await this.loadKeys()
            
            console.log('[DEBUG]: Inicialización completada exitosamente');
            return {
                state: this.state,
                saveCreds: this.saveCreds.bind(this),
                saveKeys: this.saveKeys.bind(this)
            }
        } catch (error) {
            console.error('❌ ERROR en init():', error);
            throw error;
        }
    }

    /**
     * Asegura que el bucket de Supabase existe
     */
    async ensureBucketExists() {
        try {
            const { data: buckets } = await this.supabase.storage.listBuckets()
            const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName)
            
            if (!bucketExists) {
                const { error } = await this.supabase.storage.createBucket(this.bucketName, {
                    public: false,
                    allowedMimeTypes: ['application/json'],
                    fileSizeLimit: 1024 * 1024 // 1MB
                })
                if (error) throw error
            }
        } catch (error) {
            console.error('Error creando bucket:', error)
            throw error
        }
    }

    /**
     * Carga las credenciales desde Supabase Storage
     */
    async loadCreds() {
        try {
            const { data, error } = await this.supabase.storage
                .from(this.bucketName)
                .download(`${this.sessionId}/creds.json`)
            
            if (error) {
                // Si no existe el archivo, crear credenciales nuevas usando la función oficial de Baileys
                console.log('No se encontraron credenciales existentes, creando nuevas...')
                return initAuthCreds()
            }
            
            const text = await data.text()
            return JSON.parse(text, this.reviver)
        } catch (error) {
            console.log('Error cargando credenciales, creando nuevas:', error.message)
            return this.initAuthCreds()
        }
    }

    /**
     * Carga las claves desde Supabase Storage
     */
    async loadKeys() {
        try {
            const { data: files } = await this.supabase.storage
                .from(this.bucketName)
                .list(`${this.sessionId}/keys`)
            
            const keys = {}
            
            if (files && files.length > 0) {
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        try {
                            const { data } = await this.supabase.storage
                                .from(this.bucketName)
                                .download(`${this.sessionId}/keys/${file.name}`)
                            
                            const text = await data.text()
                            const keyId = file.name.replace('.json', '')
                            keys[keyId] = JSON.parse(text, this.reviver)
                        } catch (error) {
                            console.error(`Error cargando clave ${file.name}:`, error)
                        }
                    }
                }
            }
            
            return keys
        } catch (error) {
            console.error('Error cargando claves:', error)
            return {}
        }
    }

    /**
     * Guarda las credenciales en Supabase Storage
     */
    async saveCreds() {
        try {
            const credsData = JSON.stringify(this.state.creds, this.replacer, 2)
            
            const { error } = await this.supabase.storage
                .from(this.bucketName)
                .upload(`${this.sessionId}/creds.json`, credsData, {
                    contentType: 'application/json',
                    upsert: true
                })
            
            if (error) {
                if (error.message?.includes('Bucket not found')) {
                    console.error(`❌ ERROR: El bucket "${this.bucketName}" no existe en Supabase Storage.`)
                    console.error(`📝 Solución: Crea el bucket "${this.bucketName}" en tu dashboard de Supabase Storage.`)
                } else {
                    console.error('Error guardando credenciales:', error)
                }
                throw error
            }
            console.log('Credenciales guardadas exitosamente')
        } catch (error) {
            console.error('Error guardando credenciales:', error)
            throw error
        }
    }

    /**
     * Guarda las claves en Supabase Storage
     */
    async saveKeys(keys) {
        try {
            for (const [keyId, keyData] of Object.entries(keys)) {
                const keyJson = JSON.stringify(keyData, this.replacer, 2)
                
                const { error } = await this.supabase.storage
                    .from(this.bucketName)
                    .upload(`${this.sessionId}/keys/${keyId}.json`, keyJson, {
                        contentType: 'application/json',
                        upsert: true
                    })
                
                if (error) {
                    if (error.message?.includes('Bucket not found')) {
                        console.error(`❌ ERROR: El bucket "${this.bucketName}" no existe en Supabase Storage.`)
                        console.error(`📝 Solución: Crea el bucket "${this.bucketName}" en tu dashboard de Supabase Storage.`)
                    } else {
                        console.error(`Error guardando clave ${keyId}:`, error)
                    }
                } else {
                    console.log(`Clave ${keyId} guardada exitosamente`)
                }
            }
            
            // Actualizar el estado local
            this.state.keys = { ...this.state.keys, ...keys }
        } catch (error) {
            console.error('Error guardando claves:', error)
            throw error
        }
    }

    /**
     * Función replacer para JSON.stringify que maneja Buffers
     */
    replacer(key, value) {
        if (value instanceof Uint8Array || (value && value.type === 'Buffer' && Array.isArray(value.data))) {
            return {
                type: 'Buffer',
                data: Array.from(value instanceof Uint8Array ? value : value.data)
            }
        }
        return value
    }

    /**
     * Función reviver para JSON.parse que reconstruye Buffers
     */
    reviver(key, value) {
        if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
            return new Uint8Array(value.data)
        }
        return value
    }
}

/**
 * Función helper que simula el comportamiento de useMultiFileAuthState pero usando Supabase
 */
async function useSupabaseAuthState(supabaseUrl, supabaseKey, sessionId = 'default') {
    try {
        console.log('[DEBUG]: Inicializando SupabaseAuthState...');
        console.log('- URL:', supabaseUrl ? '✅ Presente' : '❌ Faltante');
        console.log('- Key:', supabaseKey ? '✅ Presente' : '❌ Faltante');
        console.log('- Session ID:', sessionId);

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL o Service Key no están configurados en las variables de entorno');
        }

        const authState = new SupabaseAuthState(supabaseUrl, supabaseKey, 'whatsapp-sessions', sessionId);
        const result = await authState.init();
        
        console.log('[DEBUG]: SupabaseAuthState inicializado exitosamente');
        return result;
    } catch (error) {
        console.error('❌ ERROR en useSupabaseAuthState:', error);
        throw error;
    }
}

export {
    SupabaseAuthState,
    useSupabaseAuthState
}