const express = require('express');
const pool = require('./db');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 8030;
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// FRONTEND
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Ajax</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
  </head>
  <body>
    <main id="content" class="container pt-5">
      <div id="productos" class="row"></div>
      <div class="row">
        <div class="col-12 col-lg-4">
          <div class="d-flex justify-content-between pt-3">
            <button class="btn btn-outline-success" onclick="limpiar();">
              <i class="bi bi-arrow-counterclockwise fw-bold fs-5 pe-2"></i>
              Limpiar
            </button>
            <button class="btn btn-outline-primary" onclick="getProducts();">
              <i class="bi bi-cart4 fw-bold fs-5 pe-2"></i>
              Obtener productos
            </button>
          </div>
        </div>
      </div>
      <div class="row g-3 mt-5">
        <div class="col-sm-4">
          <input class="form-control" type="text" id="nombreProducto" placeholder="Nombre del producto">
        </div>
        <div class="col-sm-4">
          <input class="form-control" type="text" id="precioProducto" placeholder="Precio">
        </div>
        <div class="col-sm-4">
          <button class="btn btn-sm btn-outline-primary" onclick="agregarProducto();">
            <i class="bi bi-cart4 fw-bold fs-5 pe-2"></i>
            Guardar producto
          </button>
        </div>
      </div>
    </main>
    <script>
      function agregarProducto() {
        let nombreInput = $('#nombreProducto').val();
        let precioInput = $('#precioProducto').val();
        if (!nombreInput || !precioInput) {
          alert('Por favor, llena todos los campos.');
          return;
        }
        let nuevoProducto = { nombre: nombreInput, precio: parseFloat(precioInput) };
        $.ajax({
          url: '/productos',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(nuevoProducto),
          success: function() {
            alert('Producto agregado con éxito');
            $('#nombreProducto').val('');
            $('#precioProducto').val('');
            getProducts();
          },
          error: function() { alert('Error al conectar con el servidor.'); }
        });
      }

      function limpiar() {
        $('#productos').html('');
      }

      function eliminarProducto(productId) {
        $.ajax({
          url: '/productos/' + productId,
          type: 'DELETE',
          success: function() { limpiar(); getProducts(); },
          error: function(error) {
            console.error('Hubo un error al eliminar:', error);
            alert('No se pudo eliminar el producto.');
          }
        });
      }

      function getProducts() {
        limpiar();
        $.ajax({
          url: '/productos',
          cache: false,
          success: function(result) {
            $.each(result, function(index, productos) {
              var itemHtml = "<div class='col-12 col-sm-6 col-md-3'>" +
                "<div class='card mb-4 shadow border-primary'>" +
                "<div class='card-body'><h4>" + productos.nombre + "</h4>" +
                "<h5>Precio: " + productos.precio + "</h5></div>" +
                "<div class='card-footer bg-white d-flex justify-content-end'>" +
                "<button class='btn btn-sm btn-outline-primary' onclick='eliminarProducto(" + productos.id + ")'>Eliminar</button>" +
                "</div></div></div>";
              $('#productos').append(itemHtml);
            });
          }
        });
      }
    </script>
  </body>
</html>
    `);
});

// 1.- OBTENER => Obtener todos los productos
app.get('/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
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
