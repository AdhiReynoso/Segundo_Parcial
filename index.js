const express = require('express');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8030;

// Middleware para entender JSON en las peticiones
app.use(express.json());

// RUTA DE PRUEBA
app.get('/hola', (req, res) => {
  res.send('¡Hola mundo desde mi laptop Asus con Debian!');
});

// 1. OBTENER PRODUCTOS (GET)
app.get('/productos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM productos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREAR PRODUCTO (POST)
app.post('/productos', async (req, res) => {
  try {
    const { nombre, precio } = req.body;
    if (!nombre || !precio) {
      return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }
    const nuevo = await pool.query(
      'INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *',
      [nombre, precio]
    );
    res.status(201).json(nuevo.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ACTUALIZAR TODO (PUT)
app.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio } = req.body;
    const resultado = await pool.query(
      'UPDATE productos SET nombre = $1, precio = $2 WHERE id = $3 RETURNING *',
      [nombre, precio, id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ mensaje: "Actualizado por completo", producto: resultado.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ACTUALIZACIÓN PARCIAL (PATCH)
app.patch('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const campos = req.body;
  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ error: "No enviaste campos para actualizar" });
  }
  try {
    const llaves = Object.keys(campos);
    const valores = Object.values(campos);
    const setQuery = llaves.map((llave, index) => `${llave} = $${index + 1}`).join(', ');
    const query = `UPDATE productos SET ${setQuery} WHERE id = $${llaves.length + 1} RETURNING *`;
    const resultado = await pool.query(query, [...valores, id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ mensaje: "Modificado parcialmente", producto: resultado.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. ELIMINAR (DELETE)
app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró el producto" });
    }
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
