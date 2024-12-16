import Carrito from '../models/Carrito.js';
import Producto from '../models/Productos.js';
 
// Función para mostrar el carrito
export const mostrarCarrito = async (req, res) => {
  try {
    // Obtener el carrito del usuario (suponiendo que tienes autenticación)
    const carrito = await Carrito.findOne({ usuarioId: req.usuario.id }).populate('productos.productoId');

    if (!carrito || carrito.productos.length === 0) {
      return res.render('carrito', {
        nombrePagina: 'Carrito de Compras',
        mensaje: 'Tu carrito está vacío.',
        carrito: [],
      });
    }

    // Calcular el total del carrito
    const total = carrito.productos.reduce((acc, item) => acc + item.productoId.precio * item.cantidad, 0);

    res.render('carrito', {
      nombrePagina: 'Carrito de Compras',
      carrito: carrito.productos,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al mostrar el carrito');
  }
};

// Función para agregar un producto al carrito
export const agregarProductoCarrito = async (req, res) => {
  const { productoId, cantidad } = req.body;

  // Validación de entrada
  if (!productoId || !cantidad || cantidad <= 0) {
    return res.redirect('/carrito');
  }

  try {
    // Buscar el producto en la base de datos
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.redirect('/carrito');
    }

    // Buscar el carrito del usuario
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    // Si no existe un carrito, crear uno
    if (!carrito) {
      carrito = new Carrito({
        usuarioId: req.usuario.id,
        productos: [],
      });
    }

    // Verificar si el producto ya está en el carrito
    const productoEnCarrito = carrito.productos.find(item => item.productoId.toString() === productoId);
    if (productoEnCarrito) {
      // Si el producto ya está en el carrito, solo actualizar la cantidad
      productoEnCarrito.cantidad += cantidad;
    } else {
      // Si no está en el carrito, agregar el producto con la cantidad
      carrito.productos.push({ productoId, cantidad });
    }

    // Guardar el carrito actualizado
    await carrito.save();

    res.redirect('/carrito');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al agregar el producto al carrito');
  }
};

// Función para eliminar un producto del carrito
export const eliminarProductoCarrito = async (req, res) => {
  const { productoId } = req.params;

  try {
    // Buscar el carrito del usuario
    const carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      return res.redirect('/carrito');
    }

    // Eliminar el producto del carrito
    carrito.productos = carrito.productos.filter(item => item.productoId.toString() !== productoId);

    // Guardar el carrito actualizado
    await carrito.save();

    res.redirect('/carrito');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al eliminar el producto del carrito');
  }
};

// Función para actualizar la cantidad de un producto en el carrito
export const actualizarCantidadProducto = async (req, res) => {
  const { productoId } = req.params;
  const { cantidad } = req.body;

  // Validación de entrada
  if (cantidad <= 0) {
    return res.redirect('/carrito');
  }

  try {
    // Buscar el carrito del usuario
    const carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      return res.redirect('/carrito');
    }

    // Buscar el producto en el carrito
    const productoEnCarrito = carrito.productos.find(item => item.productoId.toString() === productoId);
    if (!productoEnCarrito) {
      return res.redirect('/carrito');
    }

    // Actualizar la cantidad del producto
    productoEnCarrito.cantidad = cantidad;

    // Guardar el carrito actualizado
    await carrito.save();

    res.redirect('/carrito');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al actualizar la cantidad del producto');
  }
};

// Función para vaciar el carrito
export const vaciarCarrito = async (req, res) => {
  try {
    // Buscar y vaciar el carrito del usuario
    await Carrito.findOneAndUpdate({ usuarioId: req.usuario.id }, { $set: { productos: [] } });

    res.redirect('/carrito');
  } catch (error) {
    console.log(error);
    res.status(500).send('Error al vaciar el carrito');
  }
};
