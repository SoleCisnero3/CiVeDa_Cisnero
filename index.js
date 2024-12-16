import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import passport from './config/passport.js';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import appRoutes from './routes/appRoutes.js'; // Importa tus rutas de la aplicación
import conectarDB from './config/db.js'; // Importa la función para conectar a la BD
import './jobs/limpiarTurnos.js'; // Importa el job de limpieza de turnos

dotenv.config({ path: '.env' }); // Cargar las variables de entorno desde el archivo .env

// Verificar las variables de entorno cargadas
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const app = express();
const port = process.env.PORT || 3030;

// Conectar a la base de datos
conectarDB().catch((err) => {
  console.error('No se pudo conectar a la base de datos:', err.message);
  process.exit(1); // Terminar el proceso si no hay conexión
});

// Configuración de vistas y layouts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'main'); // Establecer layout por defecto
app.use(expressLayouts);

// Middleware para archivos estáticos y análisis de datos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar la sesión
app.use(
  session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

// Configurar connect-flash
app.use(flash());

// Configurar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware para pasar mensajes flash y autenticación a las vistas
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});


function isAuthenticated(req, res, next) {
  if (req.session && req.session.usuario) {  // Verifica si hay una sesión activa
      return next();  // Si está autenticado, permite que continúe
  } 
  res.redirect('/iniciar-sesion');  // Si no está autenticado, redirige a la página de inicio de sesión
}
// Rutas de la aplicación
app.use('/', appRoutes);

// Rutas de autenticación con Google
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


app.get('/sacar-turno', isAuthenticated, (req, res) => {
  res.render('sacar-turno');
});

app.get('/sacar-turno2', isAuthenticated, (req, res) => {
  res.render('sacar-turno2');
});

app.get('/iniciar-sesion', (req, res) => {
  res.render('iniciar-sesion');
});
app.get('/crear-cuenta', (req, res) => {
  res.render('crear-cuenta');
});
//app.use('/turnos', require('./router/Turnos'));
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard'); // Redirige después de iniciar sesión con éxito
  }
);




// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
}).on('error', (err) => {
  console.error('Error al iniciar el servidor:', err.message);
});
