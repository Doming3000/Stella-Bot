import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Definición de la función para conectar a la base de datos
export function connectToDatabase() {
  mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch((error) => console.error('Error al conectar a MongoDB:', error));
}