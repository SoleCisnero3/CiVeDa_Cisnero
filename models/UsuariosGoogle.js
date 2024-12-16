import mongoose from 'mongoose';

const usuarioGoogleSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
  },
  imagen: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

const UsuarioGoogle = mongoose.model('UsuarioGoogle', usuarioGoogleSchema);
export default UsuarioGoogle;
