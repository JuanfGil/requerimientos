const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL + "?sslmode=require"
});

// 🛠️ Crear la tabla si no existe
const createTable = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS requerimientos (
                id SERIAL PRIMARY KEY,
                cliente VARCHAR(255) NOT NULL,
                requerimiento TEXT NOT NULL,
                prioridad VARCHAR(10) NOT NULL,
                responsable VARCHAR(255) NOT NULL,
                estado VARCHAR(20) NOT NULL,
                linea VARCHAR(255),
                categoria VARCHAR(255),
                observaciones TEXT,
                avance TEXT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ Tabla 'requerimientos' verificada o creada correctamente.");
    } catch (error) {
        console.error("❌ Error al crear/verificar la tabla:", error);
    }
};

// Ejecutar la creación de la tabla al iniciar el servidor
createTable();

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("API de Requerimientos en funcionamiento.");
});

// Obtener todos los requerimientos
app.get("/requerimientos", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM requerimientos ORDER BY id DESC");
        res.json(result.rows);
    } catch (error) {
        console.error("❌ Error al obtener requerimientos:", error);
        res.status(500).json({ error: "Error al obtener los requerimientos" });
    }
});

// Crear un nuevo requerimiento
app.post("/requerimientos", async (req, res) => {
    try {
        const { cliente, requerimiento, prioridad, responsable, estado, linea, categoria, observaciones } = req.body;

        if (!cliente || !requerimiento || !prioridad || !responsable || !estado) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        const result = await pool.query(
            "INSERT INTO requerimientos (cliente, requerimiento, prioridad, responsable, estado, linea, categoria, observaciones) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
            [cliente, requerimiento, prioridad, responsable, estado, linea, categoria, observaciones]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error al crear requerimiento:", error);
        res.status(500).json({ error: "Error al crear el requerimiento" });
    }
});

// Actualizar un requerimiento (estado y avances)
app.put("/requerimientos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { avance, estado } = req.body;

        const result = await pool.query(
            "UPDATE requerimientos SET avance = $1, estado = $2 WHERE id = $3 RETURNING *",
            [avance, estado, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ Error al actualizar requerimiento:", error);
        res.status(500).json({ error: "Error al actualizar el requerimiento" });
    }
});

// Eliminar un requerimiento
app.delete("/requerimientos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM requerimientos WHERE id = $1", [id]);
        res.json({ message: "Requerimiento eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar requerimiento:", error);
        res.status(500).json({ error: "Error al eliminar el requerimiento" });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
