// models/Usuario.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Esquema para Mongoose
const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        maxlength: 60,
    },
    imagen: {
        type: String,
        maxlength: 60,
    },
    email: {
        type: String,
        required: [true, 'El correo es obligatorio'],
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Agrega un correo válido'],
    },
    telefono: {
        type: String,
        required: [true, 'El número de teléfono es obligatorio'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    activo: {
        type: Boolean,
        default: false,
    },
    rol: {
        type: String,
        default: 'usuario',
    },
    tokenPassword: String,
    expiraToken: Date,
}, { timestamps: true }); // Agrega marcas de tiempo para la creación y actualización

// Hook antes de guardar el usuario (para encriptar la contraseña)
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next(); // Si la contraseña no fue modificada, no hacer nada
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar contraseñas
usuarioSchema.methods.validarPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

// Crear el modelo de Usuario
const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;
