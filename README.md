# 🎬 SOFTCINE API – Backend Explicado (Para Exposición)

Este documento es una guía detallada sobre la arquitectura, el funcionamiento intero y las decisiones técnicas del Backend de SOFTCINE. Está diseñado para ofrecer todo el contexto necesario para una sustentación o exposición del proyecto.

---

## 1. 🔄 El Salto: De `json-server` a `Express` + `MySQL`

El proyecto inicial usaba `json-server` interactuando con un archivo local (`db.json`). Aunque era excelente para prototipos rápidos, esa arquitectura limitaba el proyecto por varias razones:
- **Ausencia de Persistencia en la Nube:** Si la aplicación se hospedaba en una plataforma gratuita, el archivo `db.json` se reiniciaba periódicamente provocando pérdida de comentarios.
- **Sin Validación Fuerte de Esquemas:** Podían inyectarse datos inconsistentes.
- **Falta de Seguridad Granular:** Era muy complicado proteger ciertas rutas basándose en roles.

**Solución Implementada:**  
La arquitectura evolucionó hacia un **Servidor con Express.js y Base de Datos MySQL** (hospedada en la nube usando Clever Cloud), siguiendo el modelo de diseño por capas (Controlador-Rutas-Servicios). Esta evolución permite resiliencia de datos, seguridad, roles escalables, validación estricta y preparó la plataforma para un entorno productivo real.

---

## 2. 🏗️ Arquitectura por Capas del Backend

El backend se encuentra dividido modularmente, garantizando que cada archivo hace solo aquello de lo que es responsable (*Single Responsibility Principle*):

```textz
backend-SOFTCINE-main/
│
├── .env                       # Credenciales y secretos (nunca se sube a Git)
├── package.json               # Dependencias (Express, mysql2, JWT, etc.)
├── server.js                  # 🟢 Punto de entrada (solo levanta el puerto HTTP)
├── app.js                     # ⚙️ Configuración troncal (CORS, Middlewares, Auth)
│
├── /config/
│   └── database.js            # 🗄️ Establece y exporta el "pool" de conexión MySQL (con SSL).
│
├── /routes/
│   ├── index.js               # 🔀 Agrupa todas las rutas y define rutas base (ej. /api/health).
│   └── comentarios.routes.js  # 🛤️ Define endpoints, verbos HTTP y aplica Middlewares de roles.
│
├── /controllers/
│   └── comentarios.controller.js # 🧠 Lógica de peticiones HTTP: recibe de 'req', valida y responde 'res'.
│
└── /services/
    └── comentarios.service.js # 🛠️ Lógica de negocio pura y consultas SQL. Aisla la base de datos.
```

### ¿Por qué esta estructura?
Si mañana cambiamos MySQL por PostgreSQL o MongoDB, **solo** será necesario modificar la capa `/services` y `/config`. Los Controladores y las Rutas no se verán afectados por el cambio.

---

## 3. 🔐 Seguridad y Autenticación Continua

Este fue uno de los mayores desafíos técnicos resueltos en el Backend.

### JWT (JSON Web Tokens) en Cookies HttpOnly
Cuando un usuario hace login, enviamos a su navegador un JWT cifrado, pero en lugar de mandarlo en texto plano, **viaja dentro de una cookie `HttpOnly`**.
- *Ventaja:* JavaScript del navegador no puede acceder a esta cookie (previniendo robos por ataques XSS).
- El navegador se encarga de enviarla automáticamente en cada solicitud de red hacia el servidor.

### Políticas de Roles y Middlewares
En `routes/comentarios.routes.js`, definimos interceptores (*middlewares*). Éstos actúan como aduanas antes de que una petición alcance el controlador:
1. `authenticate`: Lee la cookie. Valida la firma del JWT usando la clave secreta. Si el token es inválido, corta el flujo devolviendo código de error HTTP `401 Unauthorized`.
2. `requireAdmin`: Se ejecuta inmediatamente después. Verifica si dentro de la información del JWT decodificada la propiedad `role` es `"admin"`. Si el rol es el de un usuario básico, devuelve código `403 Forbidden`.

Gracias a esto:
*   `POST /api/comentarios` $\rightarrow$ Protegido solo por `authenticate` (permite crear).
*   `PUT /api/comentarios/:id` $\rightarrow$ Protegido por `authenticate` **y** `requireAdmin` (solo un admin puede editar).

---

## 4. 🔗 Flujo de la Información (Caso Práctico)

¿Qué sucede cuando un administrador da clic en *"Editar Comentario"* desde el Modal del Frontend?

| Paso | Quien actúa | Acción que ocurre |
| :-: | :-- | :-- |
| **1** | Frontend | La interfaz Vite manda una solicitud `PUT /api/comentarios/25`. Viaja con credenciales incluidas (la cookie viaja). |
| **2** | Express (`app.js`) | Recibe la petición, verifica si las reglas **CORS** aprobadas permiten origen desde el frontend. Si todo está en orden da paso. |
| **3** | Rutas (`comentarios.routes.js`) | Escanea la ruta. Envía la petición al control de Middlewares (`authenticate` comprueba el token, luego `requireAdmin` comprueba el rol de administrador). |
| **4** | Controlador (`comentarios.controller.js`) | Valida el cuerpo (ej. "el comentario debe tener entre 10 y 300 caracteres"). Evita mandar carga extra al servidor base. |
| **5** | Servicio (`comentarios.service.js`) | Forma la Query inyectando la información hacia **MySQL** protegiéndose contra el SQL Injection usando comandos como `pool.query('UPDATE... WHERE id = ?', [data, id])`. |
| **6** | Clever Cloud (MySQL) | Corre la orden real de sobre escritura y devuelve éxito o fallo. |
| **7** | Controlador HTTP | Recibe luz verde del servicio y lanza el código HTTP `200 OK` reenviando el comentario modificado para que el Frontend repinte la pantalla ágilmente. |

---

## 5. 🌐 Conectividad a la Base de Datos (Connection Pooling)

La conexión a la base de datos MySQL (Hospedada en Clever Cloud) no ocurre petición tras petición. En lugar de eso el código ejecuta el concepto de **Pool de conexiones** a través de `mysql2`.
Esto significa que el archivo `config/database.js` prepara un "límite" inicial (ej. un grupo de 10 mangueras o tuberías preparadas para conectar) que quedan abiertas. Cada petición tomará prestada una conexión que liberará posteriormente. 

**Implementación de SSL Compartido:** 
Se especificó la variable objeto `ssl: { rejectUnauthorized: false }` porque los paquetes del servicio dev en Clever Cloud usan certificados globales que NodeJS rechazaría bajo normas severas por defecto en `production` y `dev`.

---

## 6. 🛣️ Checklist de Endpoints API Exuestos

La lógica HTTP del controlador mapeada visualmente:

| Verbo | Ruta | Rol Mínimo | Lógica Relacionada |
| --- | --- | --- | --- |
| **POST** | `/api/login` | Público | Autentica a base de variables hardcodeadas (SENA) |
| **GET** | `/api/me` | Autenticado | Utilidad de inicio. El Frontend comprueba si un usuario sigue vivo o la sesión expiró |
| **POST** | `/api/logout` | Autenticado | Se solicita la eliminación y purga de la Cookie de Autenticación |
| **GET** | `/api/comentarios?movieId=X` | Autenticado | Lee de una película puntual y los muestra. |
| **POST** | `/api/comentarios` | Autenticado | Creación estándar (Suma la fecha actual desde MySQL y usa email de JWT activo) |
| **PUT** | `/api/comentarios/:id` | **Administrador** | Modificación validada localmente en Express de textos y calificaciones |
| **DELETE**| `/api/comentarios/:id` | **Administrador** | Purga una fila entera de la B.D. basada en la Key `ID` del SQL. |

---

> **Conclusión General para Exposición:**  
> En resumen, esta arquitectura convierte un proyecto puramente formativo en un escenario tipo real-world. Aísla correctamente la presentación del almacenamiento de su estado, asegura transferencias de datos vía tokens sellados para que ni siquiera manipulaciones de LocalStorage quiebren la barrera de seguridad, e inyecta la solidez y versatilidad de Express y SQL en un proyecto fuertemente acoplable.
