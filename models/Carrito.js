import mongoose from 'mongoose';

const carritoSchema = new mongoose.Schema({
  cantidad: {
    type: Number,
    required: true,
    default: 1,
    min: [1, 'La cantidad mínima es 1'],
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true,
  },
}, {
  timestamps: true,
});

const Carrito = mongoose.model('Carrito', carritoSchema);
export default Carrito;
