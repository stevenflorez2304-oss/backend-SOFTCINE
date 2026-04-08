-- ============================================================
-- SOFTCINE – Script de creación de tabla
-- ⚠️  En Clever Cloud NO ejecutes CREATE DATABASE ni USE
--     porque ya te proporcionan la BD creada.
--     Ejecuta directamente el CREATE TABLE y los INSERT.
-- ============================================================

-- Tabla principal de comentarios
CREATE TABLE IF NOT EXISTS comentarios (
  id           INT           NOT NULL AUTO_INCREMENT,
  movie_id     VARCHAR(20)   NOT NULL,
  nombre       VARCHAR(50)   NOT NULL,
  calificacion TINYINT       NOT NULL,
  comentario   TEXT          NOT NULL,
  autor_email  VARCHAR(100)  NOT NULL,
  fecha        DATETIME      DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_movie_id (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Datos de prueba (opcional)
-- ============================================================
INSERT INTO comentarios (movie_id, nombre, calificacion, comentario, autor_email)
VALUES
  ('550',   'Carlos Pérez', 5, 'Una obra maestra del cine moderno. Totalmente recomendada.', 'user@sena.com'),
  ('550',   'Laura García', 4, 'Muy buena película, aunque el final podría ser mejor.',      'user@sena.com'),
  ('27205', 'Andrés López', 5, 'Inception es simplemente increíble. El mejor thriller.',     'admin@sena.com');
