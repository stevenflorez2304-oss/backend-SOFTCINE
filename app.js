// app.js
// Configuración global de Express: middlewares, CORS, auth endpoints
// Los endpoints de negocio están en /routes

require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const jwt          = require("jsonwebtoken");
const apiRoutes    = require("./routes/index");

const app = express();

// ─── 1. CORS ───────────────────────────────────────────────────────────────────
// En desarrollo: permite localhost:5173 (Vite)
// En producción: permite FRONTEND_URL del .env (Netlify/etc.)
const allowedOrigins = [
  process.env.FRONTEND_URL,       // variable obligatoria en .env
  "http://localhost:5173",         // Vite dev server (siempre permitido)
  "http://localhost:4173",         // Vite preview
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej: Postman, curl, mismo servidor)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin no permitido → ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Responder OK a preflight OPTIONS (manejado auto por app.use(cors))

// ─── 2. Parsers ────────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── 3. Endpoints de autenticación ────────────────────────────────────────────
const SECRET_KEY = process.env.SECRET_KEY || "super_secreto_cinescope_v1";

// Usuarios hardcodeados (no hay tabla users aún)
const USERS = [
  { email: "admin@sena.com", password: "1234", role: "admin" },
  { email: "user@sena.com",  password: "1234", role: "user"  },
];

const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge:   3_600_000, // 1 hora en ms
});

// POST /api/login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const found = USERS.find(u => u.email === email && u.password === password);
  if (!found) {
    return res.status(401).json({ message: "Credenciales incorrectas." });
  }
  const token = jwt.sign({ email: found.email, role: found.role }, SECRET_KEY, { expiresIn: "1h" });
  res.cookie("auth_token", token, cookieOptions());
  return res.status(200).json({ message: "Login exitoso.", user: { email: found.email, role: found.role } });
});

// GET /api/me  – verificar sesión activa
app.get("/api/me", (req, res) => {
  const token = req.cookies?.auth_token;
  if (!token) return res.status(401).json({ message: "No autenticado." });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return res.status(200).json({ user: { email: decoded.email, role: decoded.role } });
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
});

// POST /api/logout
app.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });
  return res.status(200).json({ message: "Logout exitoso." });
});

// ─── 4. Rutas de la API ────────────────────────────────────────────────────────
app.use("/api", apiRoutes);

// ─── 5. Manejo de rutas no encontradas ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Ruta ${req.method} ${req.path} no encontrada.` });
});

// ─── 6. Manejo global de errores ───────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Error global]", err.message);
  res.status(500).json({ message: "Error interno del servidor." });
});

module.exports = app;
