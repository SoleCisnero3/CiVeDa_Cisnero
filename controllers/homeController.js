import Productos from '../models/Productos.js';
import Categoria from '../models/Categoria.js';

const home = async (req, res) => {
    try {
        const { categoria } = req.query; // Obtener la categoría desde la query string
        const usuario = req.user;
        
        // Configurar las condiciones de búsqueda
        const whereCondition = categoria ? { categoriaId: categoria } : {};

        // Obtener productos destacados de manera aleatoria (hasta 4 productos)
        const productosDestacados = await Productos.aggregate([
            { $match: whereCondition }, // Filtro por categoría si existe
            { $sample: { size: 4 } }, // Selección aleatoria de 4 productos
            { $lookup: { from: 'categorias', localField: 'categoriaId', foreignField: '_id', as: 'categoria' } } // Realiza el join con la colección de categorías
        ]);

        // Obtener todas las categorías
        const categorias = await Categoria.find();

        // Renderizar la vista
        res.render('home', {
            nombrePagina: 'Inicio',
            layout: req.isAuthenticated() ? 'main-logged-in' : 'main',
            productosDestacados,
            categorias,
            selectedCategoria: categoria,
            usuario
        });

    } catch (error) {
        console.log(error);
        res.status(500).render('error', {
            nombrePagina: 'Error',
            mensaje: 'Error interno del servidor'
        });
    }
};

export { home };
