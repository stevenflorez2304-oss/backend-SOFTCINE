// routes/comentarios.routes.js
// Rutas del módulo de comentarios con middlewares de autenticación y autorización

const { Router } = require("express");
const ctrl = require("../controllers/comentarios.controller");

const router = Router();

// ──────────────────────────────────────────────────────────────────────────────
// Middlewares de autorización (definidos aquí para reutilizar fácilmente)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Verifica que el request tenga un JWT válido en la cookie auth_token.
 * Inyecta req.user = { email, role } si es válido.
 */
function authenticate(req, res, next) {
  const jwt = require("jsonwebtoken");
  const token = req.cookies?.auth_token;
  if (!token) return res.status(401).json({ message: "No autenticado." });

  try {
    req.user = jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
}

/**
 * Verifica que el usuario autenticado tenga rol 'admin'.
 * Debe usarse después de `authenticate`.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso denegado. Solo administradores." });
  }
  next();
}

// ──────────────────────────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────────────────────────

// GET  /api/comentarios?movieId=X  → cualquier usuario autenticado
router.get("/",            authenticate,              ctrl.listar);

// POST /api/comentarios            → cualquier usuario autenticado
router.post("/",           authenticate,              ctrl.crear);

// PUT  /api/comentarios/:id        → solo admin
router.put("/:id",         authenticate, requireAdmin, ctrl.actualizar);

// DELETE /api/comentarios/:id     → solo admin
router.delete("/:id",      authenticate, requireAdmin, ctrl.eliminar);

module.exports = router;
