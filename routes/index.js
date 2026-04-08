// routes/index.js
// Router principal – punto de entrada de todas las rutas de la API

const { Router } = require("express");
const comentariosRoutes = require("./comentarios.routes");

const router = Router();

// Montar sub-rutas bajo /api
router.use("/comentarios", comentariosRoutes);

// Ruta de health-check (útil para Render y monitoreo)
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

module.exports = router;
