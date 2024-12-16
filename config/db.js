// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.6gzio.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority&appName=Cluster0`;

const conectarDB = async () => {
  try {
    await mongoose.connect(uri);  // Eliminando las opciones obsoletas
    console.log('Base de datos conectada correctamente');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1); // Termina el proceso si no se puede conectar
  }
};

export default conectarDB;
