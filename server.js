// Importamos librerías necesarias
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = "super_secreto_cinescope_v1";

server.use(middlewares);

// Habilitar CORS para peticiones desde el frontend (Netlify/Localhost)
server.use(cors({
  origin: process.env.FRONTEND_URL || "https://softcine.netlify.app",
  credentials: true
}));

// Habilitar cookie parser
server.use(cookieParser());
server.use(jsonServer.bodyParser);

// Endpoint de login
server.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  // Credenciales hardcodeadas por ahora, o buscar en db.json si lo prefieres
  if (email === "admin@sena.com" && password === "1234") {
    const token = jwt.sign({ email, role: "admin" }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3600000 // 1 hora
    });
    return res.status(200).json({ message: "Login exitoso", user: { email, role: "admin" } });
  }

  if (email === "user@sena.com" && password === "1234") {
    const token = jwt.sign({ email, role: "user" }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 3600000 // 1 hora
    });
    return res.status(200).json({ message: "Login exitoso", user: { email, role: "user" } });
  }

  return res.status(401).json({ message: "Credenciales incorrectas" });
});

// Endpoint para verificar sesión (recarga de página)
server.get("/api/me", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return res.status(200).json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
});

// Endpoint de logout
server.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
  });
  return res.status(200).json({ message: "Logout exitoso" });
});

// Usamos el router definido para las otras rutas REST
// Montarlo bajo /api para mantener la convención, o en la raíz
server.use("/api", router);

server.listen(PORT, () => {
  console.log(`JSON Server con Auth está corriendo en el puerto ${PORT}`);
});