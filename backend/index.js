const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  user: process.env.DB_USER || "app_user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "airbnb_cleaning",
  port: process.env.DB_PORT || 5432,
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Solo admin" });
  }
  next();
}

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (user.status !== "active") {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en login" });
  }
});

// CREATE USER
app.post("/admin/create-user", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role = "worker" } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Ese email ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING id, name, email, role, status
      `,
      [name, email, hashedPassword, role]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creando usuario:", error);
    res.status(500).json({ error: "Error creando usuario" });
  }
});

// CREATE PROPERTY
app.post("/admin/create-property", requireAuth, requireAdmin, async (req, res) => {
  const {
    property_name,
    address_line_1,
    city,
    door_code,
    entry_instructions,
    notes,
  } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO properties (
        property_name,
        address_line_1,
        city,
        door_code,
        entry_instructions,
        notes,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, property_name, address_line_1, city, door_code, entry_instructions, notes, is_active
      `,
      [
        property_name,
        address_line_1,
        city,
        door_code || "",
        entry_instructions || "",
        notes || "",
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error creando propiedad:", error);
    res.status(500).json({ error: "Error creando propiedad" });
  }
});

// GET WORKERS
app.get("/admin/workers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, email, role, status
      FROM users
      WHERE role = 'worker'
      ORDER BY name ASC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error cargando workers:", error);
    res.status(500).json({ error: "Error cargando workers" });
  }
});

// GET PROPERTIES FOR ADMIN
app.get("/admin/properties", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        property_name,
        address_line_1,
        city,
        door_code,
        entry_instructions,
        notes,
        is_active
      FROM properties
      ORDER BY property_name ASC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error cargando propiedades admin:", error);
    res.status(500).json({ error: "Error cargando propiedades" });
  }
});

// ASSIGN PROPERTY TO WORKER
app.post("/admin/assign-property", requireAuth, requireAdmin, async (req, res) => {
  const { user_id, property_id, assigned_date } = req.body;

  if (!user_id || !property_id || !assigned_date) {
    return res.status(400).json({
      error: "user_id, property_id y assigned_date son requeridos",
    });
  }

  try {
    const existingAssignment = await pool.query(
      `
      SELECT id
      FROM assignments
      WHERE user_id = $1
        AND property_id = $2
        AND assigned_date = $3
        AND is_active = true
      LIMIT 1
      `,
      [user_id, property_id, assigned_date]
    );

    if (existingAssignment.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Esa propiedad ya está asignada para esa fecha" });
    }

    const result = await pool.query(
      `
      INSERT INTO assignments (user_id, property_id, assigned_date, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, user_id, property_id, assigned_date, is_active
      `,
      [user_id, property_id, assigned_date]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error asignando propiedad:", error);
    res.status(500).json({ error: "Error asignando propiedad" });
  }
});

// WORKER PROPERTIES
app.get("/properties/:userId", requireAuth, async (req, res) => {
  const requestedUserId = req.params.userId;

  if (
    req.user.role !== "admin" &&
    String(req.user.id) !== String(requestedUserId)
  ) {
    return res.status(403).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        p.id,
        p.property_name,
        p.address_line_1,
        p.city,
        p.door_code,
        p.entry_instructions,
        p.notes
      FROM properties p
      INNER JOIN assignments a ON p.id = a.property_id
      WHERE a.user_id = $1
        AND a.is_active = true
        AND p.is_active = true
        AND a.assigned_date = CURRENT_DATE
      ORDER BY p.property_name ASC
      `,
      [requestedUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error cargando propiedades:", error);
    res.status(500).json({ error: "Error cargando propiedades" });
  }
});

// DEACTIVATE PROPERTY
app.patch(
  "/admin/properties/:id/deactivate",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `
        UPDATE properties
        SET is_active = false
        WHERE id = $1
        RETURNING
          id,
          property_name,
          address_line_1,
          city,
          door_code,
          entry_instructions,
          notes,
          is_active
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Propiedad no encontrada" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error desactivando propiedad:", error);
      res.status(500).json({ error: "Error desactivando propiedad" });
    }
  }
);

// UPDATE PROPERTY
app.put("/admin/properties/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    property_name,
    address_line_1,
    city,
    door_code,
    entry_instructions,
    notes,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE properties
      SET
        property_name = $1,
        address_line_1 = $2,
        city = $3,
        door_code = $4,
        entry_instructions = $5,
        notes = $6
      WHERE id = $7
      RETURNING id, property_name, address_line_1, city, door_code, entry_instructions, notes
      `,
      [
        property_name,
        address_line_1,
        city,
        door_code,
        entry_instructions,
        notes,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error actualizando propiedad:", error);
    res.status(500).json({ error: "Error actualizando propiedad" });
  }
});
app.patch("/admin/properties/:id/deactivate", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE properties
      SET is_active = false
      WHERE id = $1
      RETURNING id, property_name, address_line_1, city, door_code, entry_instructions, notes, is_active
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json({
      message: "Property deactivated",
      property: result.rows[0],
    });
  } catch (error) {
    console.error("Error desactivando propiedad:", error);
    res.status(500).json({ error: "Error desactivando propiedad" });
  }
});
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
