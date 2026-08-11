# AnonPosts - Aplicación de Publicaciones Anónimas

Una aplicación web simple que permite a los usuarios hacer publicaciones anónimas con un diseño similar a X (Twitter). Incluye filtrado automático de contenido ofensivo y detección NSFW para imágenes.

## 🚀 Características

- **Publicaciones anónimas** con título, descripción e imagen opcional
- **Diseño moderno** similar a X con estética minimalista
- **Filtrado automático** de contenido ofensivo en texto
- **Detección NSFW** para imágenes usando NSFWJS
- **Feed público** con publicaciones en orden cronológico
- **Diseño responsive** para móviles y escritorio
- **Base de datos MongoDB** para persistencia

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MongoDB con Mongoose
- Multer para subida de archivos
- NSFWJS para detección de contenido NSFW
- CORS para comunicación frontend-backend

### Frontend
- HTML5 + CSS3 + JavaScript vanilla
- Diseño similar a X con estética minimalista
- Fetch API para peticiones HTTP
- Diseño responsive

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd anon-posts-app
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar el archivo `.env` con tu configuración:
   ```
   MONGODB_URI=mongodb://localhost:27017/anon-posts
   PORT=5000
   ```

4. **Iniciar la aplicación**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

5. **Abrir en el navegador**
   ```
   http://localhost:5000
   ```

## 🌐 Uso

1. **Acceder a la aplicación**: Abre tu navegador en `http://localhost:5000`
2. **Crear publicación**: Haz clic en "Nueva Publicación" y completa el formulario
3. **Ver feed**: Las publicaciones aparecen automáticamente en el feed principal
4. **Contenido NSFW**: Las imágenes detectadas como NSFW se muestran con un overlay de advertencia

## 🔧 Configuración

### Base de datos
- **MongoDB local**: Asegúrate de tener MongoDB ejecutándose localmente
- **MongoDB Atlas**: Reemplaza la URI en el archivo `.env`

### Filtrado de contenido
- Las palabras ofensivas se filtran automáticamente en español
- Puedes modificar la lista en `server.js` en la variable `offensiveWords`

### Detección NSFW
- Usa NSFWJS para detectar contenido inapropiado en imágenes
- Umbral configurable en la función `detectNSFW`

## 📁 Estructura del proyecto

```
anon-posts-app/
├── index.html             # Página principal de la aplicación
├── styles.css             # Estilos CSS
├── script.js              # JavaScript del frontend
├── uploads/               # Imágenes subidas (se crea automáticamente)
├── server.js              # Servidor Express
├── package.json           # Dependencias del proyecto
└── README.md
```

## 🎨 Diseño

El diseño está inspirado en X (Twitter) con:
- **Colores**: Negro, blanco y grises
- **Tipografía**: Inter (similar a la de X)
- **Layout**: Columna centrada con tarjetas limpias
- **Responsive**: Adaptable a móviles y escritorio

## 🔒 Seguridad

- **Filtrado de contenido**: Texto ofensivo se reemplaza automáticamente
- **Validación de archivos**: Solo se permiten imágenes (JPEG, PNG, GIF, WebP)
- **Límite de tamaño**: Máximo 5MB por imagen
- **Detección NSFW**: Imágenes inapropiadas se marcan automáticamente

## 🚀 Despliegue

### Heroku
1. Conecta tu repositorio a Heroku
2. Configura las variables de entorno
3. Despliega automáticamente

### Vercel + MongoDB Atlas
1. Despliega el frontend en Vercel
2. Usa MongoDB Atlas para la base de datos
3. Configura las variables de entorno

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## ⚠️ Notas importantes

- Esta aplicación es para fines educativos y de demostración
- El filtrado de contenido es básico y puede no ser 100% efectivo
- La detección NSFW puede tener falsos positivos/negativos
- Considera implementar moderación humana para uso en producción
