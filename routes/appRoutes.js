// appRoutes.js
import express from 'express';
import { home } from '../controllers/homeController.js';
import { formCrearCuenta, crearCuenta, formIniciarSesion, confirmarCuenta, formularioOlvidePassword, resetPassword, comprobarToken, nuevoPassword, cerrarSesion } from '../controllers/usuariosController.js';
import { autenticarUsuario, usuarioAutenticado, seleccionarLayout, usuarioAdmin } from '../controllers/authController.js';
import { subirImagen, formularioCrearProducto, guardarProducto, mostrarProductos, verProducto, formularioEditarProducto, actualizarProducto, eliminarProducto } from '../controllers/productosController.js'; // Cambiado editarProducto a formularioEditarProducto
import { admin } from '../controllers/adminController.js';
import { agregarProductoCarrito, eliminarProductoCarrito, mostrarCarrito } from '../controllers/carritoController.js';
import { iniciarPago, verificarPago } from '../controllers/pagoController.js';
import { obtenerHorariosDisponibles, reservarTurno, mostrarFormularioTurno, actualizarTurno, eliminarTurno } from '../controllers/turnosController.js';

const router = express.Router();

router.get('/', seleccionarLayout, home);

// Crear y confirmar cuentas
router.get('/crear-cuenta', formCrearCuenta);
router.post('/crear-cuenta', crearCuenta);

router.get('/mensaje');
router.get('/confirmar/:correo', confirmarCuenta);

// Iniciar sesión
router.get('/iniciar-sesion', formIniciarSesion);
router.post('/iniciar-sesion', autenticarUsuario);
router.post('/cerrar-sesion', cerrarSesion);

// reset password
router.get('/olvide-password', formularioOlvidePassword);
router.post('/olvide-password', resetPassword);

// Almacena el nuevo password...
router.get('/olvide-password/:tokenPassword', comprobarToken);
router.post('/olvide-password/:tokenPassword', nuevoPassword);

// Ruta de productos
router.get('/crear-producto', seleccionarLayout, usuarioAdmin, formularioCrearProducto);
router.post('/crear-producto', seleccionarLayout, usuarioAdmin, subirImagen, guardarProducto);
router.get('/productos', seleccionarLayout, usuarioAutenticado, mostrarProductos, seleccionarLayout);
router.get('/productos/:id', seleccionarLayout, usuarioAutenticado, verProducto, seleccionarLayout);

router.get('/editar-producto/:id', seleccionarLayout, usuarioAdmin, formularioEditarProducto); // Cambiado editarProducto a formularioEditarProducto
router.post('/editar-producto/:id', seleccionarLayout, usuarioAdmin, subirImagen, actualizarProducto); // Cambiado editarProducto a formularioEditarProducto

// Eliminar producto
router.delete('/productos/:id', seleccionarLayout, usuarioAdmin, eliminarProducto);

// Rutas de carrito
router.get('/carrito', seleccionarLayout, mostrarCarrito);
router.post('/carrito/:id', seleccionarLayout, agregarProductoCarrito);
router.delete('/carrito/:id', seleccionarLayout, eliminarProductoCarrito);


// Rutas de pago
router.get('/pago/:total', seleccionarLayout, iniciarPago);
router.get('/verificar-pago', seleccionarLayout, verificarPago);

// Rutas de reservas
router.get('/sacar-turno', seleccionarLayout, mostrarFormularioTurno);
router.post('/sacar-turno', seleccionarLayout, reservarTurno);

// Editar y eliminar turno
router.post('/editar-turno/:id', seleccionarLayout, actualizarTurno);
router.delete('/turnos/:id', seleccionarLayout, eliminarTurno);




export default router;
