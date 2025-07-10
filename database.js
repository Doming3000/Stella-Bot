import mysql from 'mysql';
import dotenv from 'dotenv';
import cron from "node-cron";

// Cargar variables de entorno
dotenv.config();

// Crear un grupo de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Función para realizar consultas
export function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
}

// Función para el keep-alive
function keepAlive () {
  // Programa: Una consulta cada 15 minutos. 4 consultas por cada hora (HH:00, HH:15, HH:30, HH:45)
  cron.schedule('0,15,30,45 * * * *', () => {
    try {
      pool.query('SELECT 1'); // Consulta simple
    } catch (error) {
      console.error('⚠️  - Se perdió la conexión con la base de datos: ', error.message);
    }
  });
}

// Función para comprobar la conexión al iniciar
export function testConnection() {
  pool.getConnection((error, connection) => {
    if (error) {
      console.error('❌  - No se pudo conectar a la base de datos:', error.message);
    } else {
      console.log('✅  - La base de datos está conectada.');
      keepAlive();
      connection.release(); // Liberar la conexión después de probar
    }
  });
}