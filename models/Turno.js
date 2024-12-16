import mongoose from 'mongoose';

const TurnoSchema = new mongoose.Schema({
    fecha: {
        type: String,
        required: true
    },
    hora: {
        type: String,
        required: true
    },
    dni: {
        type: String,
        required: true
    },
    nombreMascota: {
        type: String,
        required: true
    },
    especieMascota: {
        type: String,
        required: true
    },
    razaMascota: {
        type: String,
        required: true
    }
});

const Turno = mongoose.model('Turno', TurnoSchema);

export default Turno;
