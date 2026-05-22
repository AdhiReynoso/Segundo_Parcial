const express = require('express');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8030;

app.use(express.json());

// 1.- OBTENER => Obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        const rows = result.rows;

        const filasTabla = rows.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><span class="badge-producto">${p.nombre}</span></td>
                <td class="precio">$${Number(p.precio).toLocaleString('es-MX')}</td>
                <td>
                    <button class="btn-editar" onclick="editarProducto(${p.id}, '${p.nombre}', ${p.precio})">✏️ Editar</button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Panel de Productos</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background-color: #f4f7f6;
                        color: #333;
                        margin: 0;
                        padding: 40px;
                        display: flex;
                        justify-content: center;
                    }
                    .container {
                        width: 100%;
                        max-width: 900px;
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    }
                    h1 {
                        color: #2c3e50;
                        font-size: 24px;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #eef2f3;
                        padding-bottom: 10px;
                    }
                    .btn-agregar {
                        background-color: #27ae60;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-bottom: 20px;
                    }
                    .btn-agregar:hover { background-color: #219150; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th {
                        background-color: #34495e;
                        color: white;
                        text-align: left;
                        padding: 12px 15px;
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    td {
                        padding: 14px 15px;
                        border-bottom: 1px solid #eef2f3;
                        color: #4f5f6f;
                        font-size: 15px;
                    }
                    tr:hover { background-color: #f8fafb; }
                    .badge-producto {
                        background-color: #e8f4fd;
                        color: #1da1f2;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-weight: 500;
                    }
                    .precio { font-weight: bold; color: #27ae60; }
                    .btn-editar {
                        background-color: #f39c12;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        margin-right: 6px;
                        font-size: 13px;
                    }
                    .btn-editar:hover { background-color: #d68910; }
                    .btn-eliminar {
                        background-color: #e74c3c;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                    }
                    .btn-eliminar:hover { background-color: #c0392b; }

                    /* MODAL */
                    .modal-overlay {
                        display: none;
                        position: fixed;
                        top: 0; left: 0;
                        width: 100%; height: 100%;
                        background: rgba(0,0,0,0.4);
                        justify-content: center;
                        align-items: center;
                        z-index: 999;
                    }
                    .modal-overlay.active { display: flex; }
                    .modal {
                        background: white;
                        padding: 30px;
                        border-radius: 12px;
                        width: 380px;
                        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
                    }
                    .modal h2 { margin-top: 0; color: #2c3e50; }
                    .modal input {
                        width: 100%;
                        padding: 10px;
                        margin: 8px 0 16px 0;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        font-size: 14px;
                        box-sizing: border-box;
                    }
                    .modal-btns { display: flex; gap: 10px; justify-content: flex-end; }
                    .btn-cancelar {
                        background: #ecf0f1;
                        color: #333;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                    }
                    .btn-guardar {
                        background: #2980b9;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                    }
                    .btn-guardar:hover { background: #2471a3; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📦 Inventario de Productos</h1>
                    <button class="btn-agregar" onclick="abrirModalAgregar()">➕ Agregar Producto</button>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre del Producto</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasTabla.length > 0 ? filasTabla : '<tr><td colspan="4" style="text-align:center;">No hay productos registrados</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <!-- MODAL -->
                <div class="modal-overlay" id="modalOverlay">
                    <div class="modal">
                        <h2 id="modalTitulo">Agregar Producto</h2>
                        <label>Nombre</label>
                        <input type="text" id="inputNombre" placeholder="Nombre del producto" />
                        <label>Precio</label>
                        <input type="number" id="inputPrecio" placeholder="Precio" />
                        <div class="modal-btns">
                            <button class="btn-cancelar" onclick="cerrarModal()">Cancelar</button>
                            <button class="btn-guardar" id="btnGuardar" onclick="guardarProducto()">Guardar</button>
                        </div>
                    </div>
                </div>

                <script>
                    let modoEditar = false;
                    let idEditando = null;

                    function abrirModalAgregar() {
                        modoEditar = false;
                        idEditando = null;
                        document.getElementById('modalTitulo').textContent = 'Agregar Producto';
                        document.getElementById('inputNombre').value = '';
                        document.getElementById('inputPrecio').value = '';
                        document.getElementById('modalOverlay').classList.add('active');
                    }

                    function editarProducto(id, nombre, precio) {
                        modoEditar = true;
                        idEditando = id;
                        document.getElementById('modalTitulo').textContent = 'Editar Producto';
                        document.getElementById('inputNombre').value = nombre;
                        document.getElementById('inputPrecio').value = precio;
                        document.getElementById('modalOverlay').classList.add('active');
                    }

                    function cerrarModal() {
                        document.getElementById('modalOverlay').classList.remove('active');
                    }

                    async function guardarProducto() {
                        const nombre = document.getElementById('inputNombre').value.trim();
                        const precio = document.getElementById('inputPrecio').value.trim();

                        if (!nombre || !precio) {
                            alert('Por favor completa todos los campos');
                            return;
                        }

                        const url = modoEditar ? '/productos/' + idEditando : '/productos';
                        const method = modoEditar ? 'PUT' : 'POST';

                        await fetch(url, {
                            method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nombre, precio: parseFloat(precio) })
                        });

                        cerrarModal();
                        location.reload();
                    }

                    async function eliminarProducto(id) {
                        if (!confirm('¿Estás segura de eliminar este producto?')) return;

                        await fetch('/productos/' + id, { method: 'DELETE' });
                        location.reload();
                    }
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

// 2.- POST => Agregar un producto
app.post('/productos', async (req, res) => {
    try {
        const { nombre, precio } = req.body;
        if (!nombre || !precio) return res.status(400).json({ error: 'nombre y precio son obligatorios' });

        const result = await pool.query(
            'INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *',
            [nombre, precio]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 3.- PUT => Actualizar todo el producto
app.put('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio } = req.body;
        if (!nombre || !precio) return res.status(400).json({ error: 'nombre y precio son obligatorios' });

        const result = await pool.query(
            'UPDATE productos SET nombre = $1, precio = $2 WHERE id = $3 RETURNING *',
            [nombre, precio, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 4.- PATCH => Actualización parcial
app.patch('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio } = req.body;
        if (!nombre && !precio) return res.status(400).json({ error: 'Envía al menos nombre o precio' });

        let campos = [];
        let valores = [];
        let contador = 1;

        if (nombre) { campos.push(`nombre = $${contador++}`); valores.push(nombre); }
        if (precio) { campos.push(`precio = $${contador++}`); valores.push(precio); }
        valores.push(id);

        const result = await pool.query(
            `UPDATE productos SET ${campos.join(', ')} WHERE id = $${contador} RETURNING *`,
            valores
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 5.- DELETE => Eliminar producto
app.delete('/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ mensaje: 'Producto eliminado correctamente', producto: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Inicializar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
