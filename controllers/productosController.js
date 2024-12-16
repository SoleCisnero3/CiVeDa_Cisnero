// productosController.js

import Producto from '../models/Productos.js';
import Categorias from '../models/Categoria.js';
import fs from 'fs';
import path from 'path';
// productosController.js
import multer from 'multer';
 
// Configuración de multer para la carga de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/imagen-productos'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Agrega un timestamp para evitar nombres duplicados
  }
});

const upload = multer({ storage });

// Exportar la función subirImagen para usarla en las rutas
export const subirImagen = upload.single('imagen');  // 'imagen' es el nombre del campo en el formulario

// Función para ver un producto
export const verProducto = async (req, res) => {
  const { id } = req.params; // Obtener el id del producto desde los parámetros

  try {
    const producto = await Producto.findById(id).populate('categoria'); // Obtener el producto por su id

    if (!producto) {
      return res.status(404).render('error', {
        nombrePagina: 'Producto no encontrado',
        mensaje: 'El producto solicitado no existe.',
      });
    }

    // Renderizar la vista con la información del producto
    res.render('ver-producto', {
      nombrePagina: producto.nombre,
      producto,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('error', {
      nombrePagina: 'Error',
      mensaje: 'Error al obtener el producto',
    });
  }
};

// Función para mostrar los productos
export const mostrarProductos = async (req, res) => {
  const { pagina: paginaActual } = req.query;

  // Validar que la página es un número entero positivo
  const expresion = /^[1-9]$/;
  if (!expresion.test(paginaActual)) {
    return res.redirect('/productos?pagina=1');
  }

  try {
    const limit = 6;
    const offset = (paginaActual * limit) - limit;

    // Obtener productos desde MongoDB
    const productos = await Producto.find()
      .skip(offset)
      .limit(limit)
      .populate('categoria'); // Usando populate para traer las categorías asociadas

    const total = await Producto.countDocuments(); // Obtener el total de productos en la base de datos

    res.render('productos', {
      nombrePagina: 'Productos',
      productos,
      paginas: Math.ceil(total / limit),
      paginaActual: Number(paginaActual),
      total,
      offset,
      limit,
    });
  } catch (error) {
    console.log(error);
    res.status(500).render('error', {
      nombrePagina: 'Error',
      mensaje: 'Error interno del servidor',
    });
  }
};

// Función para mostrar el formulario de creación de productos
export const formularioCrearProducto = async (req, res) => {
  try {
    const categorias = await Categorias.find(); // Obtener todas las categorías
    res.render('crear-producto', {
      nombrePagina: 'Crear Producto',
      categorias,
      errores: [],
      datos: {},
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al obtener las categorías');
  }
};

// Función para guardar un nuevo producto
export const guardarProducto = async (req, res) => {
  const { nombre, descripcion, precio, categoria } = req.body;

  // Validación de los campos
  const errores = [];
  if (!nombre || !descripcion || !precio || !categoria) {
    errores.push({ msg: 'Todos los campos son obligatorios' });
  }
  if (!req.file) {
    errores.push({ msg: 'Debes subir una imagen' });
  }

  if (errores.length > 0) {
    const categorias = await Categorias.find();
    return res.render('crear-producto', {
      nombrePagina: 'Crear Producto',
      categorias,
      errores,
      datos: req.body,
    });
  }

  const imagen = req.file.filename;

  try {
    // Crear el nuevo producto en MongoDB
    const producto = new Producto({
      nombre,
      descripcion,
      precio,
      categoriaId: categoria,
      imagen,
      usuarioId: req.usuario.id, // Asumiendo que el usuario está autenticado
    });

    await producto.save(); // Guardar el producto en MongoDB

    res.redirect('/administracion'); // Redirigir al panel de administración
  } catch (error) {
    console.log(error);
    res.render('crear-producto', {
      nombrePagina: 'Crear Producto',
      categorias: await Categorias.find(),
      errores: [{ msg: 'Error al guardar el producto. Inténtalo de nuevo.' }],
      datos: req.body,
    });
  }
};

// Función para eliminar un producto
export const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.redirect('/administracion');
    }

    // Verificar que el usuario que solicita la eliminación es el propietario del producto
    if (producto.usuarioId.toString() !== req.usuario.id.toString()) {
      return res.redirect('/administracion');
    }

    // Eliminar la imagen del producto del sistema de archivos
    const rutaImagen = path.join(__dirname, '../public/uploads/imagen-productos', producto.imagen);
    fs.unlink(rutaImagen, (error) => {
      if (error) {
        console.error('Error al eliminar la imagen:', error);
      }
    });

    // Eliminar el producto de MongoDB
    await Producto.deleteOne({ _id: id });

    res.redirect('/administracion'); // Redirigir al panel de administración
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al eliminar el producto');
  }
};

// Función para mostrar el formulario de edición de un producto
export const formularioEditarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findById(id);
    const categorias = await Categorias.find();

    if (!producto) {
      return res.redirect('/administracion');
    }

    res.render('editar-producto', {
      nombrePagina: 'Editar Producto',
      producto,
      categorias,
      errores: [],
      datos: producto,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al obtener el producto');
  }
};

// Función para actualizar un producto
export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria } = req.body;

  // Validación de los campos
  const errores = [];
  if (!nombre || !descripcion || !precio || !categoria) {
    errores.push({ msg: 'Todos los campos son obligatorios' });
  }

  if (errores.length > 0) {
    const categorias = await Categorias.find();
    return res.render('editar-producto', {
      nombrePagina: 'Editar Producto',
      categorias,
      errores,
      datos: req.body,
    });
  }

  try {
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.redirect('/administracion');
    }

    // Actualizar los campos del producto
    producto.nombre = nombre;
    producto.descripcion = descripcion;
    producto.precio = precio;
    producto.categoriaId = categoria;

    // Si se sube una nueva imagen, actualizarla
    if (req.file) {
      // Eliminar la imagen anterior
      const rutaImagen = path.join(__dirname, '../public/uploads/imagen-productos', producto.imagen);
      fs.unlink(rutaImagen, (error) => {
        if (error) {
          console.error('Error al eliminar la imagen:', error);
        }
      });

      producto.imagen = req.file.filename; // Actualizar con la nueva imagen
    }

    await producto.save(); // Guardar el producto actualizado

    res.redirect('/administracion');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al actualizar el producto');
  }
};
