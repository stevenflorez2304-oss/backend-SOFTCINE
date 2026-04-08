// controllers/comentarios.controller.js
// Maneja req/res y validaciones para la API de comentarios.
// La autorización (admin) se delega al middleware en las rutas.

const service = require("../services/comentarios.service");

// ─── GET /api/comentarios?movieId=X ────────────────────────────────────────────
async function listar(req, res) {
  const { movieId } = req.query;
  if (!movieId) {
    return res.status(400).json({ message: "Se requiere el parámetro movieId." });
  }
  try {
    const comentarios = await service.getComentariosByMovie(movieId);
    return res.json(comentarios);
  } catch (err) {
    console.error("[listar]", err);
    return res.status(500).json({ message: "Error al obtener los comentarios." });
  }
}

// ─── POST /api/comentarios ─────────────────────────────────────────────────────
async function crear(req, res) {
  const { movieId, nombre, calificacion, comentario } = req.body;

  // Validaciones
  if (!movieId) return res.status(400).json({ message: "movieId es requerido." });
  if (!nombre || nombre.trim().length < 2 || nombre.trim().length > 50)
    return res.status(400).json({ message: "El nombre debe tener entre 2 y 50 caracteres." });
  if (!calificacion || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ message: "La calificación debe estar entre 1 y 5." });
  if (!comentario || comentario.trim().length < 10 || comentario.trim().length > 300)
    return res.status(400).json({ message: "El comentario debe tener entre 10 y 300 caracteres." });

  try {
    const nuevo = await service.createComentario({
      movieId: String(movieId),
      nombre: nombre.trim(),
      calificacion: Number(calificacion),
      comentario: comentario.trim(),
      autorEmail: req.user.email, // viene del middleware authenticate
    });
    return res.status(201).json(nuevo);
  } catch (err) {
    console.error("[crear]", err);
    return res.status(500).json({ message: "Error al guardar el comentario." });
  }
}

// ─── PUT /api/comentarios/:id ──────────────────────────────────────────────────
// Solo admin (verificado por middleware requireAdmin en las rutas)
async function actualizar(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido." });

  const { nombre, calificacion, comentario } = req.body;

  // Validaciones
  if (!nombre || nombre.trim().length < 2 || nombre.trim().length > 50)
    return res.status(400).json({ message: "El nombre debe tener entre 2 y 50 caracteres." });
  if (!calificacion || calificacion < 1 || calificacion > 5)
    return res.status(400).json({ message: "La calificación debe estar entre 1 y 5." });
  if (!comentario || comentario.trim().length < 10 || comentario.trim().length > 300)
    return res.status(400).json({ message: "El comentario debe tener entre 10 y 300 caracteres." });

  try {
    const actualizado = await service.updateComentario(id, {
      nombre: nombre.trim(),
      calificacion: Number(calificacion),
      comentario: comentario.trim(),
    });
    if (!actualizado) return res.status(404).json({ message: "Comentario no encontrado." });
    return res.json(actualizado);
  } catch (err) {
    console.error("[actualizar]", err);
    return res.status(500).json({ message: "Error al actualizar el comentario." });
  }
}

// ─── DELETE /api/comentarios/:id ───────────────────────────────────────────────
// Solo admin (verificado por middleware requireAdmin en las rutas)
async function eliminar(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido." });

  try {
    const ok = await service.deleteComentario(id);
    if (!ok) return res.status(404).json({ message: "Comentario no encontrado." });
    return res.status(200).json({ message: "Comentario eliminado correctamente." });
  } catch (err) {
    console.error("[eliminar]", err);
    return res.status(500).json({ message: "Error al eliminar el comentario." });
  }
}

module.exports = { listar, crear, actualizar, eliminar };
