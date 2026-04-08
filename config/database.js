// config/database.js
// Pool de conexiones MySQL usando mysql2 + variables de entorno (.env)
// Documentación: https://github.com/sidorares/node-mysql2#using-connection-pools

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Clever Cloud requiere SSL siempre (local y producción)
  // rejectUnauthorized: false porque usan certificados compartidos
  ssl: { rejectUnauthorized: false },
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar la conexión al arranque
pool.getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MySQL (Clever Cloud)");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Error al conectar con MySQL:", err.message);
    // No matamos el proceso; el error aparecerá en las rutas que lo usen
  });

module.exports = pool;
