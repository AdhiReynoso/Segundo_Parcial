const express = require('express');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8030;

// Middleware para entender JSON en las peticiones
app.use(express.json());

// RUTA DE PRUEBA
app.get('/hola', (req, res) => {
    res.send('¡Hola mundo desde la API!');
});

// RUTA DE PRODUCTOS (VISTA ESTÉTICA)
app.get('/productos', async (req, res) => {
    try {
        // Hacemos la consulta a la base de datos MariaDB
        const [rows] = await pool.query('SELECT * FROM productos');

        // Construimos las filas de la tabla dinámicamente con los datos mapeados
        const filasTabla = rows.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><span class="badge-producto">${p.nombre}</span></td>
                <td class="precio">$${Number(p.precio).toLocaleString('es-MX')}</td>
            </tr>
        `).join('');

        // Enviamos el diseño HTML con estilos CSS estéticos
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
                        max-width: 800px;
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
                    tr:hover {
                        background-color: #f8fafb;
                    }
                    .badge-producto {
                        background-color: #e8f4fd;
                        color: #1da1f2;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-weight: 500;
                    }
                    .precio {
                        font-weight: bold;
                        color: #27ae60;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>📦 Inventario de Productos</h1>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre del Producto</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasTabla.length > 0 ? filasTabla : '<tr><td colspan="3" style="text-align:center;">No hay productos registrados</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

// Inicializar el servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(\`🚀 Servidor corriendo en http://localhost:${PORT}\`);
});
