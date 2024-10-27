import mongoose from 'mongoose';
import { readFileSync } from 'fs';

// Leer configuración desde config.json
const config = JSON.parse(readFileSync('./config.json'));

// Función de conexión a MongoDB
export async function databaseConnect() {
  try {
    await mongoose.connect(config.mongopass);
    console.log('🟢 La base de datos esta conectada.');
  } catch (error) {
    console.error('🔴 Ha ocurido un error al conectar con la base de datos', error);
  }
}