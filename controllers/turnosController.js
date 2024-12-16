import { validationResult, check } from 'express-validator';
import Turno from '../models/Turno.js';

/*/ Mostrar el formulario para reservar turno
export const mostrarFormularioTurno = (req, res) => {
    res.render('sacar-turno', {
        nombrePagina: 'Reserva tu Turno',
        errores: [],
        datos: {}
    });
};*/

export const mostrarFormularioTurno = (req, res) => {
    /*const usuario = req.user || null; // Manejo de usuario no autenticado

    if (!usuario) {
        // Redirigir o mostrar un mensaje de error si el usuario no está autenticado
        return res.redirect('/sacar-turno'); // Cambiar a tu ruta de inicio de sesión
    }
*/
    const usuario = req.usuario;
    if (usuario != null) {
        // Redirigir o mostrar un mensaje de error si el usuario no está autenticado
        //return res.redirect('/sacar-turno'); // Cambiar a tu ruta de inicio de sesión
        res.render('sacar-turno', {
            usuario,
            nombrePagina: 'Reserva tu Turno',
            errores: [],
            datos: {}
    })} else{
        res.render('iniciar-sesion', {
            //usuario,
            nombrePagina: 'Iniciar Sesion',
            errores: [],
            datos: {}
    })
    };
};
// Obtener horarios disponibles para una fecha específica
export const obtenerHorariosDisponibles = async (req, res) => {
    const { fecha } = req.params;

    if (!fecha) {
        return res.status(400).json({ error: 'Fecha no válida' });
    }

    try {
        // Horarios predefinidos
        const horariosPredefinidos = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

        // Turnos reservados
        const turnosReservados = await Turno.find({ fecha });
        const horariosOcupados = turnosReservados.map(turno => turno.hora);

        // Filtrar horarios disponibles
        const horariosDisponibles = horariosPredefinidos.filter(hora => !horariosOcupados.includes(hora));

        res.json({ horariosDisponibles });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener horarios disponibles' });
    }
};

// Reservar un turno
export const reservarTurno = async (req, res) => {
    await check('fecha').notEmpty().withMessage('Fecha requerida').run(req);
    await check('hora').notEmpty().withMessage('Hora requerida').run(req);
    await check('dni').isNumeric().withMessage('DNI no válido').run(req);
    await check('nombreMascota').notEmpty().withMessage('Nombre de la mascota requerido').run(req);

    const resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('sacar-turno', {
            nombrePagina: 'Reserva tu Turno',
            errores: resultado.array(),
            datos: req.body
        });
    }

    try {
        const turnoExistente = await Turno.findOne({ fecha: req.body.fecha, hora: req.body.hora });

        if (turnoExistente) {
            return res.render('sacar-turno', {
                nombrePagina: 'Reserva tu Turno',
                errores: [{ msg: 'El turno ya está reservado.' }],
                datos: req.body
            });
        }

        const nuevoTurno = new Turno(req.body);
        await nuevoTurno.save();
        res.redirect('/turnos');
    } catch (error) {
        console.error(error);
        res.render('sacar-turno', {
            nombrePagina: 'Reserva tu Turno',
            errores: [{ msg: 'Error al reservar el turno.' }],
            datos: req.body
        });
    }
};

// Listar todos los turnos
export const listarTurnos = async (req, res) => {
    try {
        const turnos = await Turno.find();
        res.render('turnos', {
            nombrePagina: 'Lista de Turnos',
            turnos
        });
    } catch (error) {
        console.error(error);
        res.render('turnos', {
            nombrePagina: 'Lista de Turnos',
            errores: [{ msg: 'Error al obtener los turnos' }]
        });
    }
};

// Actualizar un turno
export const actualizarTurno = async (req, res) => {
    const { id } = req.params; // ID del turno a actualizar
    const { fecha, hora, dni, nombreMascota } = req.body; // Nuevos datos para el turno

    // Validación de los campos recibidos
    await check('fecha').notEmpty().withMessage('Fecha requerida').run(req);
    await check('hora').notEmpty().withMessage('Hora requerida').run(req);
    await check('dni').isNumeric().withMessage('DNI no válido').run(req);
    await check('nombreMascota').notEmpty().withMessage('Nombre de la mascota requerido').run(req);

    const resultado = validationResult(req);

    if (!resultado.isEmpty()) {
        return res.render('editar-turno', {
            nombrePagina: 'Editar Turno',
            errores: resultado.array(),
            datos: req.body
        });
    }

    try {
        // Comprobar si el turno ya existe con la misma fecha y hora
        const turnoExistente = await Turno.findOne({ fecha, hora, _id: { $ne: id } });

        if (turnoExistente) {
            return res.render('editar-turno', {
                nombrePagina: 'Editar Turno',
                errores: [{ msg: 'El turno ya está reservado en esa fecha y hora.' }],
                datos: req.body
            });
        }

        // Actualizar el turno en la base de datos
        const turnoActualizado = await Turno.findByIdAndUpdate(id, { fecha, hora, dni, nombreMascota }, { new: true });

        // Redirigir a la lista de turnos después de la actualización
        res.redirect('/turnos');
    } catch (error) {
        console.error(error);
        res.render('editar-turno', {
            nombrePagina: 'Editar Turno',
            errores: [{ msg: 'Error al actualizar el turno.' }],
            datos: req.body
        });
    }
};



// Eliminar un turno
export const eliminarTurno = async (req, res) => {
    const { id } = req.body;

    try {
        await Turno.findByIdAndDelete(id);
        res.redirect('/turnos');
    } catch (error) {
        console.error(error);
        res.render('turnos', {
            nombrePagina: 'Lista de Turnos',
            errores: [{ msg: 'Error al eliminar el turno' }]
        });
    }
};
