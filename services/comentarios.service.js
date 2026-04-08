// services/comentarios.service.js
// Consultas SQL para el módulo de comentarios (lógica de negocio)
// Todas las funciones devuelven Promises (mysql2/promise)

const pool = require("../config/database");

/**
 * Obtener todos los comentarios de una película.
 * @param {string} movieId - ID de la película (TMDB)
 * @returns {Promise<Array>}
 */
async function getComentariosByMovie(movieId) {
  const [rows] = await pool.query(
    `SELECT id, movie_id AS movieId, nombre, calificacion, comentario, fecha
     FROM comentarios
     WHERE movie_id = ?
     ORDER BY fecha DESC`,
    [movieId]
  );
  return rows;
}

/**
 * Crear un nuevo comentario.
 * @param {object} data - { movieId, nombre, calificacion, comentario, autorEmail }
 * @returns {Promise<object>} El comentario recién insertado
 */
async function createComentario({ movieId, nombre, calificacion, comentario, autorEmail }) {
  const [result] = await pool.query(
    `INSERT INTO comentarios (movie_id, nombre, calificacion, comentario, autor_email)
     VALUES (?, ?, ?, ?, ?)`,
    [movieId, nombre, calificacion, comentario, autorEmail]
  );

  const [rows] = await pool.query(
    `SELECT id, movie_id AS movieId, nombre, calificacion, comentario, fecha
     FROM comentarios WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
}

/**
 * Actualizar un comentario (solo admin).
 * @param {number} id - ID del comentario
 * @param {object} data - { nombre, calificacion, comentario }
 * @returns {Promise<object|null>} El comentario actualizado, o null si no existe
 */
async function updateComentario(id, { nombre, calificacion, comentario }) {
  const [result] = await pool.query(
    `UPDATE comentarios
     SET nombre = ?, calificacion = ?, comentario = ?
     WHERE id = ?`,
    [nombre, calificacion, comentario, id]
  );

  if (result.affectedRows === 0) return null;

  const [rows] = await pool.query(
    `SELECT id, movie_id AS movieId, nombre, calificacion, comentario, fecha
     FROM comentarios WHERE id = ?`,
    [id]
  );
  return rows[0];
}

/**
 * Eliminar un comentario (solo admin).
 * @param {number} id - ID del comentario
 * @returns {Promise<boolean>} true si se eliminó, false si no existía
 */
async function deleteComentario(id) {
  const [result] = await pool.query(
    `DELETE FROM comentarios WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getComentariosByMovie,
  createComentario,
  updateComentario,
  deleteComentario,
};
