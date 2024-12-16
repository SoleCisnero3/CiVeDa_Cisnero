import Usuario from '../models/Usuario.js';
import { body, check, validationResult } from 'express-validator';
import { emailConfirmarCuenta, emailOlvidePassword } from '../config/email.js';
import { generaId } from '../helpers/token.js';

// Crear cuenta (Registro de usuario)
const formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crear Cuenta',
        errores: [],
        datos: {}
    });
};

const crearCuenta = async (req, res) => {
    try {
        // Validación de campos
        await check('nombre').notEmpty().withMessage('El campo nombre es obligatorio').trim().escape().run(req);
        await check('email').notEmpty().withMessage('El campo email es obligatorio').isEmail().trim().withMessage('El formato no corresponde a un email').run(req);
        await check('telefono').notEmpty().withMessage('El campo teléfono es obligatorio').isInt().withMessage('El número no es válido').isLength({ min: 10 }).withMessage('El número de teléfono debe tener al menos 10 dígitos').trim().escape().run(req);
        await check('password').notEmpty().withMessage('El campo contraseña es obligatorio').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres').trim().escape().run(req);
        await check('repetir_password').notEmpty().withMessage('El campo repetir contraseña no puede ir vacío').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Las contraseñas no coinciden');
            }
            return true;
        }).run(req);

        let resultado = validationResult(req);

        // Extraer los datos...
        const { nombre, email, telefono, password } = req.body;

        // Verificar que el resultado esté vacío...
        if (!resultado.isEmpty()) {
            return res.render('crear-cuenta', {
                nombrePagina: 'Crear Cuenta',
                errores: resultado.array(),
                datos: req.body
            });
        }

        // Verificar que el usuario no esté duplicado...
        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            return res.render('crear-cuenta', {
                nombrePagina: 'Crear Cuenta',
                errores: [{ msg: 'El usuario ya está registrado' }],
                datos: req.body
            });
        }

        // Almacenar un usuario...
        const usuario = new Usuario({
            nombre,
            email,
            telefono,
            password
        });
        await usuario.save();

        // URL de confirmación
        const url = `http://${req.headers.host}/confirmar/${usuario.email}`;

        // Enviar mail de confirmación
        await emailConfirmarCuenta({
            email: usuario.email,
            nombre: usuario.nombre,
            url: url
        });

        res.render('mensaje', {
            nombrePagina: 'Cuenta Creada correctamente',
            mensaje: 'Cuenta Creada correctamente, hemos enviado un email para confirmar tu cuenta'
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.render('crear-cuenta', {
            nombrePagina: 'Crear Cuenta',
            errores: [{ msg: 'Ocurrió un error al crear la cuenta. Inténtalo de nuevo.' }],
            datos: req.body
        });
    }
};

// Confirmar cuenta
const confirmarCuenta = async (req, res) => {
    try {
        // verificar si el usuario existe
        const usuario = await Usuario.findOne({ email: req.params.correo });

        if (!usuario) {
            return res.render('confirmar', {
                nombrePagina: 'Error al confirmar tu cuenta',
                mensaje: 'Hubo un error al confirmar tu cuenta, por favor intenta de nuevo',
                error: true
            });
        }

        usuario.activo = true;
        await usuario.save();

        res.render('confirmar', {
            nombrePagina: '',
            mensaje: 'La cuenta se confirmó correctamente',
            error: false
        });
    } catch (error) {
        console.error('Error al confirmar usuario:', error);
    }
};

// Iniciar sesión
const formIniciarSesion = (req, res) => {
    res.render('iniciar-sesion', {
        nombrePagina: 'Iniciar Sesión'
    });
};

const autenticar = async (req, res) => {
    await check('email').isEmail().trim().escape().withMessage('El formato no corresponde a un email').run(req);
    await check('password').notEmpty().trim().escape().withMessage('La contraseña es obligatoria').run(req);

    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('iniciar-sesion', {
            nombrePagina: 'Iniciar Sesión',
            errores: resultado.array()
        });
    }

    const { email, password } = req.body;

    // Comprobar si el usuario existe...
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        return res.render('iniciar-sesion', {
            nombrePagina: 'Iniciar Sesión',
            errores: [{ msg: 'El usuario no existe' }]
        });
    }

    // Comprobar si el usuario está confirmado...
    if (!usuario.activo) {
        return res.render('iniciar-sesion', {
            nombrePagina: 'Iniciar Sesión',
            errores: [{ msg: 'Tu cuenta no está confirmada' }]
        });
    }

    // Revisar contraseña...
    if (!await usuario.validarPassword(password)) {
        return res.render('iniciar-sesion', {
            nombrePagina: 'Iniciar Sesión',
            errores: [{ msg: 'La contraseña es incorrecta' }]
        });
    }

    res.redirect('/home');
};

// Cerrar sesión
const cerrarSesion = (req, res) => {
    req.session.destroy();
    res.redirect('iniciar-sesion');
};

// Recuperar contraseña
const formularioOlvidePassword = (req, res) => {
    res.render('olvide-password', {
        nombrePagina: 'Recupera tu acceso a VeteLiceo',
        errores: []
    });
};

const resetPassword = async (req, res) => {
    await check('email').isEmail().withMessage('El formato no corresponde a un email').run(req);

    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('olvide-password', {
            nombrePagina: 'Recupera tu acceso a VeteLiceo',
            errores: resultado.array()
        });
    }

    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) {
        return res.render('olvide-password', {
            nombrePagina: 'Recupera tu acceso a VeteLiceo',
            errores: [{ msg: 'El Email no pertenece a ningun usuario' }]
        });
    }

    usuario.tokenPassword = generaId();
    await usuario.save();

    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.tokenPassword
    });

    res.render('mensaje', {
        nombrePagina: 'Reestablece tu contraseña',
        mensaje: 'Hemos enviado un email con las instrucciones'
    });
};

const comprobarToken = async (req, res) => {
    const { tokenPassword } = req.params;

    const usuario = await Usuario.findOne({ tokenPassword });

    if (!usuario) {
        return res.render('confirmar', {
            nombrePagina: 'Reestablece tu contraseña',
            mensaje: 'Hubo un error al validar tus datos, por favor intenta de nuevo',
            error: true
        });
    }

    res.render('reset-password', {
        nombrePagina: 'Restablece tu contraseña',
        tokenPassword
    });
};

const nuevoPassword = async (req, res) => {
    const { tokenPassword } = req.params;
    const { password } = req.body;

    const usuario = await Usuario.findOne({ tokenPassword });

    if (!usuario) {
        return res.render('confirmar', {
            nombrePagina: 'Restablece tu contraseña',
            mensaje: 'Hubo un error al validar tus datos, por favor intenta de nuevo',
            error: true
        });
    }

    usuario.password = password;
    usuario.tokenPassword = '';
    await usuario.save();

    res.render('mensaje', {
        nombrePagina: 'Contraseña Restablecida',
        mensaje: 'La contraseña se restableció correctamente'
    });
};

export { 
    formCrearCuenta, 
    crearCuenta, 
    confirmarCuenta, 
    formIniciarSesion, 
    autenticar, 
    cerrarSesion, 
    formularioOlvidePassword, 
    resetPassword, 
    comprobarToken, 
    nuevoPassword 
};
