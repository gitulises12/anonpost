const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const nsfw = require('nsfwjs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configurar Cloudinary (almacenamiento de imágenes en la nube)
const CLOUDINARY_ENABLED = !!(
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) ||
  process.env.CLOUDINARY_URL
);
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}
// (Si solo existe CLOUDINARY_URL, el SDK se autoconfigura al importarse)

// Sube un buffer de imagen a Cloudinary y devuelve el resultado
function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'anonposts', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '.')));

// Configuración de Multer: guardamos en memoria para subir a Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Modelos de MongoDB
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  accessCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'superadmin'],
    default: 'user'
  },
  banned: {
    type: Boolean,
    default: false
  },
  tempAdminUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Esquema para respuestas a comentarios
const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Esquema para comentarios
const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    filename: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      default: null
    },
    isNSFW: {
      type: Boolean,
      default: false
    }
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [commentSchema],
  pinned: {
    type: Boolean,
    default: false
  },
  // Fecha de expiración: MongoDB borra el post automáticamente al llegar esta fecha.
  // Si es null (ej. posts fijados), el post NO expira.
  expiresAt: {
    type: Date,
    default: null,
    expires: 0
  },
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  isNSFW: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);


// ==================== HELPERS DE ADMINISTRADOR ====================

// Verifica si un usuario tiene poderes de admin (permanente o temporal vigente)
function isAdmin(user) {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  if (user.tempAdminUntil && new Date(user.tempAdminUntil) > new Date()) return true;
  return false;
}

// Middleware: exige que quien hace la petición sea admin (se autentica por su código de acceso)
async function requireAdmin(req, res, next) {
  try {
    const code = req.headers['x-access-code'];
    if (!code) {
      return res.status(401).json({ error: 'No autorizado: falta código de acceso' });
    }
    const user = await User.findOne({ accessCode: code.trim().toUpperCase() });
    if (!user || !isAdmin(user)) {
      return res.status(403).json({ error: 'Requiere permisos de administrador' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Error en requireAdmin:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}


// Lista de palabras ofensivas (lista básica en español)
const offensiveWords = [
  'puta', 'puto', 'mierda', 'joder', 'cabron', 'cabrón', 'hijo de puta',
  'pendejo', 'pendeja', 'culero', 'culera', 'pinche', 'chingar', 'verga',
  'pendejada', 'mamada', 'pendejez', 'estupido', 'estúpido', 'idiota',
  'imbecil', 'imbécil', 'tonto', 'tonta', 'pendejear', 'mamar', 'mamón'
];

// Función para generar código de acceso único
function generateAccessCode() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos como 0, O, 1, I
  const sections = 4; // 4 secciones
  const sectionLength = 4; // 4 caracteres por sección
  let code = '';
  
  for (let i = 0; i < sections; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < sectionLength; j++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  }
  
  return code; // Formato: XXXX-XXXX-XXXX-XXXX
}

// Función para verificar si un código de acceso es único
async function generateUniqueAccessCode() {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    code = generateAccessCode();
    const existingUser = await User.findOne({ accessCode: code });
    isUnique = !existingUser;
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('No se pudo generar un código único');
  }
  
  return code;
}

// Función para filtrar contenido ofensivo
function filterOffensiveContent(text) {
  let filteredText = text.toLowerCase();
  
  offensiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredText;
}

// Función para detectar contenido NSFW en imágenes
async function detectNSFW(imagePath) {
  try {
    const model = await nsfw.load();
    const image = await nsfw.loadImage(imagePath);
    const predictions = await model.classify(image);
    
    // Buscar predicciones de contenido NSFW
    const nsfwCategories = ['Porn', 'Hentai', 'Sexy'];
    const nsfwScore = predictions
      .filter(pred => nsfwCategories.includes(pred.className))
      .reduce((sum, pred) => sum + pred.probability, 0);
    
    return nsfwScore > 0.5; // Umbral para considerar NSFW
  } catch (error) {
    console.error('Error al detectar NSFW:', error);
    return false; // En caso de error, no marcar como NSFW
  }
}

// Rutas de usuarios
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'El username es requerido' });
    }
    
    // Filtrar contenido ofensivo en el username
    const filteredUsername = filterOffensiveContent(username);
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username: filteredUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'El username ya está en uso' });
    }
    
    // Generar código de acceso único
    const accessCode = await generateUniqueAccessCode();
    
    const newUser = new User({
      username: filteredUsername,
      accessCode: accessCode
    });
    
    const savedUser = await newUser.save();
    res.status(201).json({
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        createdAt: savedUser.createdAt
      },
      accessCode: savedUser.accessCode,
      message: 'Usuario creado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.username) {
        res.status(400).json({ error: 'El username ya está en uso' });
      } else if (error.keyPattern && error.keyPattern.accessCode) {
        res.status(500).json({ error: 'Error interno. Intenta nuevamente.' });
      } else {
        res.status(400).json({ error: 'Ya existe un usuario con esos datos' });
      }
    } else {
      res.status(500).json({ error: 'Error al crear el usuario' });
    }
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { accessCode } = req.body;
    
    if (!accessCode) {
      return res.status(400).json({ error: 'El código de acceso es requerido' });
    }
    
    // Limpiar el código (remover espacios y convertir a mayúsculas)
    const cleanCode = accessCode.trim().toUpperCase();
    
    // Buscar usuario por código de acceso
    const user = await User.findOne({ accessCode: cleanCode });
    
    if (!user) {
      return res.status(401).json({ error: 'Código de acceso inválido' });
    }
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        banned: user.banned,
        tempAdminUntil: user.tempAdminUntil,
        isAdmin: isAdmin(user),
        createdAt: user.createdAt
      },
      message: 'Inicio de sesión exitoso'
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Buscar el usuario
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar publicaciones del usuario con paginación
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const totalPosts = await Post.countDocuments({ userId });
    
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt
      },
      posts,
      totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit)
    });
    
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
  }
});

// Rutas de likes
app.post('/api/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'El userId es requerido' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar la publicación
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    
    // Verificar si el usuario ya dio like a esta publicación
    const existingLike = post.likes.find(like => like.userId.toString() === userId);
    
    if (existingLike) {
      // Si ya dio like, remover el like (toggle)
      post.likes = post.likes.filter(like => like.userId.toString() !== userId);
      await post.save();
      
      // Devolver el post actualizado con información del usuario
      const updatedPost = await Post.findById(postId).populate('userId', 'username');
      res.json({ 
        message: 'Like removido', 
        post: updatedPost,
        liked: false,
        likesCount: updatedPost.likes.length
      });
    } else {
      // Si no ha dado like, agregar el like
      post.likes.push({
        userId: userId,
        createdAt: new Date()
      });
      await post.save();
      
      // Devolver el post actualizado con información del usuario
      const updatedPost = await Post.findById(postId).populate('userId', 'username');
      res.json({ 
        message: 'Like agregado', 
        post: updatedPost,
        liked: true,
        likesCount: updatedPost.likes.length
      });
    }
    
  } catch (error) {
    console.error('Error al procesar like:', error);
    res.status(500).json({ error: 'Error al procesar el like' });
  }
});

// Rutas de comentarios
app.post('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, content } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'Usuario y contenido son requeridos' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar la publicación
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    
    // Filtrar contenido ofensivo
    const filteredContent = filterOffensiveContent(content);
    
    // Crear nuevo comentario
    const newComment = {
      userId: userId,
      content: filteredContent,
      likes: [],
      replies: [],
      createdAt: new Date()
    };
    
    post.comments.push(newComment);
    await post.save();
    
    // Devolver el post actualizado con información del usuario
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username')
      .populate('comments.userId', 'username')
      .populate('comments.replies.userId', 'username');
    
    res.status(201).json({
      message: 'Comentario agregado',
      comment: updatedPost.comments[updatedPost.comments.length - 1],
      commentsCount: updatedPost.comments.length
    });
    
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
});

app.post('/api/posts/:postId/comments/:commentId/replies', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId, content } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'Usuario y contenido son requeridos' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar la publicación
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    
    // Buscar el comentario
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    
    // Filtrar contenido ofensivo
    const filteredContent = filterOffensiveContent(content);
    
    // Crear nueva respuesta
    const newReply = {
      userId: userId,
      content: filteredContent,
      likes: [],
      createdAt: new Date()
    };
    
    comment.replies.push(newReply);
    await post.save();
    
    // Devolver el post actualizado con información del usuario
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'username')
      .populate('comments.userId', 'username')
      .populate('comments.replies.userId', 'username');
    
    const updatedComment = updatedPost.comments.id(commentId);
    
    res.status(201).json({
      message: 'Respuesta agregada',
      reply: updatedComment.replies[updatedComment.replies.length - 1],
      repliesCount: updatedComment.replies.length
    });
    
  } catch (error) {
    console.error('Error al crear respuesta:', error);
    res.status(500).json({ error: 'Error al crear la respuesta' });
  }
});

app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'El userId es requerido' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar la publicación
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    
    // Buscar el comentario
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    
    // Verificar si el usuario ya dio like a este comentario
    const existingLike = comment.likes.find(like => like.userId.toString() === userId);
    
    if (existingLike) {
      // Si ya dio like, remover el like (toggle)
      comment.likes = comment.likes.filter(like => like.userId.toString() !== userId);
      await post.save();
      
      res.json({ 
        message: 'Like removido del comentario', 
        liked: false,
        likesCount: comment.likes.length
      });
    } else {
      // Si no ha dado like, agregar el like
      comment.likes.push({
        userId: userId,
        createdAt: new Date()
      });
      await post.save();
      
      res.json({ 
        message: 'Like agregado al comentario', 
        liked: true,
        likesCount: comment.likes.length
      });
    }
    
  } catch (error) {
    console.error('Error al procesar like del comentario:', error);
    res.status(500).json({ error: 'Error al procesar el like del comentario' });
  }
});

app.post('/api/posts/:postId/comments/:commentId/replies/:replyId/like', async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'El userId es requerido' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    // Buscar la publicación
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    
    // Buscar el comentario
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    
    // Buscar la respuesta
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Respuesta no encontrada' });
    }
    
    // Verificar si el usuario ya dio like a esta respuesta
    const existingLike = reply.likes.find(like => like.userId.toString() === userId);
    
    if (existingLike) {
      // Si ya dio like, remover el like (toggle)
      reply.likes = reply.likes.filter(like => like.userId.toString() !== userId);
      await post.save();
      
      res.json({ 
        message: 'Like removido de la respuesta', 
        liked: false,
        likesCount: reply.likes.length
      });
    } else {
      // Si no ha dado like, agregar el like
      reply.likes.push({
        userId: userId,
        createdAt: new Date()
      });
      await post.save();
      
      res.json({ 
        message: 'Like agregado a la respuesta', 
        liked: true,
        likesCount: reply.likes.length
      });
    }
    
  } catch (error) {
    console.error('Error al procesar like de la respuesta:', error);
    res.status(500).json({ error: 'Error al procesar el like de la respuesta' });
  }
});

// Rutas de publicaciones
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'username role')
      .populate('comments.userId', 'username role')
      .populate('comments.replies.userId', 'username role')
      .limit(50);
    
    // Calcular score de likes recientes (últimas 24 horas) para cada post
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const postsWithScore = posts.map(post => {
      // Contar likes de las últimas 24 horas
      const recentLikes = post.likes.filter(like => 
        new Date(like.createdAt) >= twentyFourHoursAgo
      ).length;
      
      return {
        ...post.toObject(),
        recentLikesScore: recentLikes
      };
    });
    
    // Ordenar: primero los fijados (pinned), luego por likes recientes, luego por fecha
    postsWithScore.sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) {
        return a.pinned ? -1 : 1; // Los fijados siempre arriba
      }
      if (a.recentLikesScore !== b.recentLikesScore) {
        return b.recentLikesScore - a.recentLikesScore; // Más likes recientes primero
      }
      return new Date(b.createdAt) - new Date(a.createdAt); // Más recientes primero
    });
    
    res.json(postsWithScore);
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    res.status(500).json({ error: 'Error al obtener las publicaciones' });
  }
});

app.post('/api/posts', upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, userId } = req.body;
    
    // Validar que se proporcionen título, descripción y userId
    if (!title || !description || !userId) {
      return res.status(400).json({ error: 'Título, descripción y usuario son requeridos' });
    }
    
    // Verificar que el usuario exista
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    if (user.banned) {
      return res.status(403).json({ error: 'Tu cuenta está baneada y no puede publicar' });
    }

    // Límite de 3 publicaciones activas por usuario (el SUPERADMIN está exento)
    if (user.role !== 'superadmin') {
      const activePosts = await Post.countDocuments({ userId });
      if (activePosts >= 3) {
        return res.status(400).json({ error: 'Solo puedes tener 3 publicaciones activas al mismo tiempo. Espera a que alguna expire (duran 1 hora).' });
      }
    }

    // Filtrar contenido ofensivo
    const filteredTitle = filterOffensiveContent(title);
    const filteredDescription = filterOffensiveContent(description);
    
    // Procesar imágenes si existen
    let images = [];
    let hasNSFWContent = false;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let imageRef = null;   // URL de Cloudinary o nombre de archivo local
        let publicId = null;
        let isNSFW = false;

        // 1) Guardar la imagen (Cloudinary si está configurado, si no en disco local)
        try {
          if (CLOUDINARY_ENABLED) {
            const result = await uploadToCloudinary(file.buffer);
            imageRef = result.secure_url;
            publicId = result.public_id;
          } else {
            const ext = path.extname(file.originalname) || '.jpg';
            const fname = 'image-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
            const dir = path.join(__dirname, 'uploads');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, fname), file.buffer);
            imageRef = fname;
          }
        } catch (err) {
          console.error('Error al guardar imagen:', err);
          continue; // Si falla el guardado, saltamos esta imagen
        }

        // 2) Detección NSFW (best-effort, desde un archivo temporal)
        try {
          const tmpPath = path.join(os.tmpdir(), 'nsfw-' + Date.now() + '-' + Math.round(Math.random() * 1E9));
          fs.writeFileSync(tmpPath, file.buffer);
          isNSFW = await detectNSFW(tmpPath);
          fs.unlink(tmpPath, () => {});
        } catch (err) {
          isNSFW = false;
        }

        images.push({ filename: imageRef, publicId, isNSFW });
        if (isNSFW) hasNSFWContent = true;
      }
    }
    
    // Crear nueva publicación
    // Los posts expiran (se borran solos) 1 hora después de crearse
    const ONE_HOUR = 60 * 60 * 1000;
    const newPost = new Post({
      title: filteredTitle,
      description: filteredDescription,
      images: images,
      userId: userId,
      isNSFW: hasNSFWContent,
      expiresAt: new Date(Date.now() + ONE_HOUR)
    });
    
    const savedPost = await newPost.save();
    
    // Devolver el post con información del usuario
    const populatedPost = await Post.findById(savedPost._id)
      .populate('userId', 'username role')
      .populate('comments.userId', 'username role')
      .populate('comments.replies.userId', 'username role');
    res.status(201).json(populatedPost);
    
  } catch (error) {
    console.error('Error al crear publicación:', error);
    res.status(500).json({ error: 'Error al crear la publicación' });
  }
});



// Reportar una publicación (cualquier usuario logueado, una vez por usuario)
app.post('/api/posts/:postId/report', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Debes iniciar sesión para reportar' });
    }
    const post = await Post.findById(req.params.postId).populate('userId', 'role');
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    // Las publicaciones del SUPERADMIN no se pueden reportar
    if (post.userId && post.userId.role === 'superadmin') {
      return res.status(403).json({ error: 'No se puede reportar una publicación del administrador' });
    }
    // Evitar reportes duplicados del mismo usuario
    const alreadyReported = post.reports.some(r => r.userId.toString() === userId);
    if (alreadyReported) {
      return res.status(400).json({ error: 'Ya reportaste esta publicación', reportCount: post.reports.length });
    }
    post.reports.push({ userId, reason: reason || '' });
    await post.save();
    res.json({ message: 'Publicación reportada. Gracias por avisar.', reportCount: post.reports.length });
  } catch (error) {
    console.error('Error al reportar publicación:', error);
    res.status(500).json({ error: 'Error al reportar la publicación' });
  }
});

// ==================== RUTAS DE ADMINISTRADOR (SUPERADMIN) ====================

// Editar (modificar) el título y/o descripción de cualquier publicación
app.put('/api/posts/:postId', requireAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    if ((!title || !title.trim()) && (!description || !description.trim())) {
      return res.status(400).json({ error: 'Debes enviar un título o una descripción' });
    }
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    if (title && title.trim()) post.title = title.trim().substring(0, 200);
    if (description && description.trim()) post.description = description.trim().substring(0, 2000);
    await post.save();
    const updated = await Post.findById(post._id)
      .populate('userId', 'username role')
      .populate('comments.userId', 'username role')
      .populate('comments.replies.userId', 'username role');
    res.json({ message: 'Publicación modificada', post: updated });
  } catch (error) {
    console.error('Error al editar publicación:', error);
    res.status(500).json({ error: 'Error al editar la publicación' });
  }
});

// Descartar (limpiar) los reportes de una publicación
app.post('/api/posts/:postId/dismiss-reports', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    post.reports = [];
    await post.save();
    res.json({ message: 'Reportes descartados' });
  } catch (error) {
    console.error('Error al descartar reportes:', error);
    res.status(500).json({ error: 'Error al descartar los reportes' });
  }
});

// Borrar cualquier publicación
app.delete('/api/posts/:postId', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    // Intentar borrar las imágenes asociadas (Cloudinary o disco local)
    if (post.images && post.images.length > 0) {
      post.images.forEach(img => {
        if (img.publicId) {
          cloudinary.uploader.destroy(img.publicId).catch(() => {}); // Silencioso
        } else if (img.filename && !/^https?:\/\//.test(img.filename)) {
          const filePath = path.join(__dirname, 'uploads', img.filename);
          fs.unlink(filePath, () => {}); // Silencioso: si no existe, no pasa nada
        }
      });
    }
    res.json({ message: 'Publicación eliminada', postId: req.params.postId });
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    res.status(500).json({ error: 'Error al eliminar la publicación' });
  }
});

// Fijar / desfijar una publicación
app.post('/api/posts/:postId/pin', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    post.pinned = !post.pinned;
    // Al fijar, el post deja de expirar; al desfijar, vuelve a durar 1 hora
    if (post.pinned) {
      post.expiresAt = null;
    } else {
      post.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }
    await post.save();
    res.json({ message: post.pinned ? 'Publicación fijada (ya no expira)' : 'Publicación desfijada', pinned: post.pinned });
  } catch (error) {
    console.error('Error al fijar publicación:', error);
    res.status(500).json({ error: 'Error al fijar la publicación' });
  }
});

// Borrar un comentario
app.delete('/api/posts/:postId/comments/:commentId', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    comment.deleteOne();
    await post.save();
    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
});

// Borrar una respuesta
app.delete('/api/posts/:postId/comments/:commentId/replies/:replyId', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Respuesta no encontrada' });
    }
    reply.deleteOne();
    await post.save();
    res.json({ message: 'Respuesta eliminada' });
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    res.status(500).json({ error: 'Error al eliminar la respuesta' });
  }
});

// Banear / desbanear un usuario
app.post('/api/admin/users/:userId/ban', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (user.role === 'superadmin') {
      return res.status(403).json({ error: 'No puedes banear al SUPERADMIN' });
    }
    user.banned = !user.banned;
    await user.save();
    res.json({ message: user.banned ? 'Usuario baneado' : 'Usuario desbaneado', banned: user.banned });
  } catch (error) {
    console.error('Error al banear usuario:', error);
    res.status(500).json({ error: 'Error al banear el usuario' });
  }
});

// Otorgar SUPERADMIN temporal (5 minutos) a un usuario
app.post('/api/admin/users/:userId/grant-temp', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const FIVE_MINUTES = 5 * 60 * 1000;
    user.tempAdminUntil = new Date(Date.now() + FIVE_MINUTES);
    await user.save();
    res.json({
      message: `Poderes de admin otorgados a @${user.username} por 5 minutos`,
      tempAdminUntil: user.tempAdminUntil
    });
  } catch (error) {
    console.error('Error al otorgar admin temporal:', error);
    res.status(500).json({ error: 'Error al otorgar admin temporal' });
  }
});

// Estadísticas + bandeja de publicaciones + lista de usuarios (para el panel)
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const totalUsers = await User.countDocuments();

    // Contar comentarios y likes recorriendo los posts
    const allPosts = await Post.find().select('comments likes');
    let totalComments = 0;
    let totalLikes = 0;
    allPosts.forEach(p => {
      totalComments += p.comments ? p.comments.length : 0;
      totalLikes += p.likes ? p.likes.length : 0;
      if (p.comments) {
        p.comments.forEach(c => {
          totalComments += c.replies ? c.replies.length : 0;
        });
      }
    });

    // Bandeja: publicaciones REPORTADAS, ordenadas por número de reportes (mayor primero)
    const reportedRaw = await Post.find({ 'reports.0': { $exists: true } })
      .populate('userId', 'username role')
      .select('title description userId createdAt pinned likes comments images reports');
    reportedRaw.sort((a, b) => (b.reports.length - a.reports.length));

    // Lista de usuarios
    const users = await User.find()
      .select('username role banned tempAdminUntil createdAt')
      .sort({ createdAt: -1 });

    const now = new Date();
    const usersOut = users.map(u => ({
      _id: u._id,
      username: u.username,
      role: u.role,
      banned: u.banned,
      isTempAdmin: !!(u.tempAdminUntil && new Date(u.tempAdminUntil) > now),
      tempAdminUntil: u.tempAdminUntil,
      createdAt: u.createdAt
    }));

    res.json({
      stats: {
        totalPosts,
        totalUsers,
        totalComments,
        totalLikes,
        totalReported: reportedRaw.length
      },
      reportedPosts: reportedRaw.map(p => ({
        _id: p._id,
        title: p.title,
        author: p.userId ? p.userId.username : 'Usuario eliminado',
        authorRole: p.userId ? p.userId.role : null,
        createdAt: p.createdAt,
        pinned: p.pinned,
        likes: p.likes ? p.likes.length : 0,
        comments: p.comments ? p.comments.length : 0,
        images: p.images ? p.images.length : 0,
        reportCount: p.reports.length
      })),
      users: usersOut
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Ruta principal para servir la aplicación HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Conectar a MongoDB Atlas (la URI se lee SOLO del archivo .env por seguridad)
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: Falta MONGODB_URI en el archivo .env');
  process.exit(1);
}
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Conectado a MongoDB');
})
.catch((error) => {
  console.error('Error al conectar a MongoDB:', error);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Abre tu navegador en: http://localhost:${PORT}`);
});
