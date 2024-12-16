import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Usuario from '../models/Usuario.js';
import UsuarioGoogle from '../models/UsuariosGoogle.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Estrategia de autenticación local
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const usuario = await Usuario.findOne({ where: { email, activo: 1 } });

            if (!usuario) {
                return done(null, false, { message: 'El usuario no existe o la cuenta no está confirmada' });
            }

            const verificarPass = await usuario.validarPassword(password);

            if (!verificarPass) {
                return done(null, false, { message: 'La contraseña es incorrecta' });
            }

            return done(null, usuario);
        } catch (error) {
            return done(error);
        }
    }
));

// Estrategia de autenticación con Google
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let usuarioGoogle = await UsuarioGoogle.findOne({ where: { googleId: profile.id } });

            if (!usuarioGoogle) {
                usuarioGoogle = await UsuarioGoogle.create({
                    googleId: profile.id,
                    nombre: profile.displayName,
                    email: profile.emails[0].value
                });
            }

            return done(null, usuarioGoogle);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialización y deserialización de usuarios
passport.serializeUser((user, done) => {
    done(null, user.id); // Serializar el ID del usuario
});

passport.deserializeUser(async (id, done) => {
    try {
        // Buscar al usuario en las bases de datos de Usuario o UsuarioGoogle
        let user = await Usuario.findByPk(id);
        if (!user) {
            user = await UsuarioGoogle.findByPk(id);
        }

        done(null, user);
    } catch (error) {
        done(error);
    }
});

export default passport;
