import dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV || process.env.ENV || 'development';
console.log('[Environment]:', environment);

// Lista de números autorizados para usar comandos de configuración
const AUTHORIZED_NUMBERS = [
  // Agregar aquí los números de teléfono de los dueños de locales
  // Formato: '1234567890' (sin espacios, guiones o símbolos)
  // Ejemplo: '5491123456789'
  '5493518576432'
];

const config = {
  development: {
    API_URL: process.env.API_BASE_URL
      ? `${process.env.API_BASE_URL}:${process.env.API_PORT || 3001}/`
      : 'http://localhost:3001/',
  },
  production: {
    API_URL: process.env.API_URL,
  },
};

if (!config[environment].API_URL) {
  throw new Error(`API_URL no definida para el entorno ${environment}`);
}

export default config[environment];
export { AUTHORIZED_NUMBERS };
