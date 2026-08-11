// Lista de palabras ofensivas (lista básica en español)
const offensiveWords = [
    'puta', 'puto', 'mierda', 'joder', 'cabron', 'cabrón', 'hijo de puta',
    'pendejo', 'pendeja', 'culero', 'culera', 'pinche', 'chingar', 'verga',
    'pendejada', 'mamada', 'pendejez', 'estupido', 'estúpido', 'idiota',
    'imbecil', 'imbécil', 'tonto', 'tonta', 'pendejear', 'mamar', 'mamón'
];

// Función para filtrar contenido ofensivo
function filterOffensiveContent(text) {
    let filteredText = text.toLowerCase();
    
    offensiveWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredText;
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Hace unos minutos';
    } else if (diffInHours < 24) {
        return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
}

// Función para mostrar el formulario de nueva publicación
function showPostForm() {
    document.getElementById('postForm').classList.remove('hidden');
    document.getElementById('postTitle').focus();
}

// Función para ocultar el formulario de nueva publicación
function hidePostForm() {
    document.getElementById('postForm').classList.add('hidden');
    document.getElementById('newPostForm').reset();
    document.getElementById('fileText').textContent = 'Agregar imágenes (máximo 5)';
    document.getElementById('errorMessage').classList.add('hidden');
    
    // Limpiar array de imágenes seleccionadas y vista previa
    selectedImages = [];
    updateImagePreviewsFromArray();
}

// Función para manejar el cambio de archivos
document.getElementById('postImages').addEventListener('change', function(e) {
    const newFiles = Array.from(e.target.files);
    const maxFiles = 5;
    
    // Verificar límite total
    if (selectedImages.length + newFiles.length > maxFiles) {
        const remaining = maxFiles - selectedImages.length;
        showError(`Solo puedes agregar ${remaining} imagen(es) más. Máximo ${maxFiles} imágenes.`);
        e.target.value = '';
        return;
    }
    
    // Agregar nuevas imágenes al array
    newFiles.forEach(file => {
        selectedImages.push(file);
    });
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = '';
    
    updateImagePreviewsFromArray();
    updateFileText();
});

function updateFileText() {
    const fileText = document.getElementById('fileText');
    const count = selectedImages.length;
    
    if (count === 0) {
        fileText.textContent = 'Agregar imágenes (máximo 5)';
    } else if (count === 1) {
        fileText.textContent = '1 imagen seleccionada';
    } else {
        fileText.textContent = `${count} imágenes seleccionadas`;
    }
}

function updateImagePreviewsFromArray() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.className = 'preview-image';
        img.src = URL.createObjectURL(file);
        img.alt = `Vista previa ${index + 1}`;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image-btn';
        removeBtn.textContent = '×';
        removeBtn.type = 'button';
        removeBtn.onclick = () => removeImageFromArray(index);
        
        const fileName = document.createElement('span');
        fileName.className = 'image-name';
        fileName.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        previewItem.appendChild(fileName);
        
        container.appendChild(previewItem);
    });
    
    // Agregar botón "+" si hay menos de 5 imágenes
    if (selectedImages.length < 5) {
        const addMoreBtn = document.createElement('div');
        addMoreBtn.className = 'add-more-btn';
        addMoreBtn.onclick = () => document.getElementById('postImages').click();
        
        addMoreBtn.innerHTML = `
            <div class="add-more-icon">+</div>
            <span class="add-more-text">Agregar más</span>
        `;
        
        container.appendChild(addMoreBtn);
    }
}

function removeImageFromArray(indexToRemove) {
    selectedImages.splice(indexToRemove, 1);
    updateImagePreviewsFromArray();
    updateFileText();
}

function addMoreImages() {
    if (selectedImages.length >= 5) {
        showError('Máximo 5 imágenes permitidas');
        return;
    }
    
    document.getElementById('postImages').click();
}

// Función para mostrar mensajes de error
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Función para ocultar mensajes de error
function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

// Devuelve la URL correcta de una imagen (Cloudinary = URL completa; local = /uploads/)
function imgSrc(filename) {
    if (!filename) return '';
    return /^https?:\/\//.test(filename) ? filename : '/uploads/' + filename;
}

// Función para crear una tarjeta de publicación
function createPostCard(post) {
    const postCard = document.createElement('article');
    postCard.className = 'post-card';
    
    const imagesHtml = post.images && post.images.length > 0 ? `
        <div class="post-images-container">
            ${post.images.map((imageObj, index) => `
                <div class="post-image-item ${post.images.length > 1 ? 'multiple-images' : 'single-image'}">
                    ${imageObj.isNSFW ? `
                        <div class="nsfw-overlay" onclick="showNSFWImage(this, '${imageObj.filename}')">
                            <div class="nsfw-content">
                                <span class="nsfw-icon">⚠️</span>
                                <p>Contenido NSFW</p>
                                <button class="nsfw-button">Hacer clic para ver</button>
                            </div>
                        </div>
                    ` : `
                        <img src="${imgSrc(imageObj.filename)}" alt="Imagen ${index + 1} de la publicación" class="post-image" onclick="openImageModal(this.src)">
                    `}
                </div>
            `).join('')}
            ${post.images.length > 1 ? `<div class="image-count">+${post.images.length} fotos</div>` : ''}
        </div>
    ` : '';
    
    const authorName = post.userId && post.userId.username ? post.userId.username : 'Usuario eliminado';
    const authorId = post.userId && post.userId._id ? post.userId._id : null;
    const authorRole = post.userId && post.userId.role ? post.userId.role : null;
    const isSuperAuthor = authorRole === 'superadmin';
    const authorLabel = isSuperAuthor ? `👑 @${authorName}` : `@${authorName}`;
    const likesCount = post.likes ? post.likes.length : 0;
    const userHasLiked = post.likes && currentUser ? post.likes.some(like => like.userId === currentUser._id) : false;

    // Controles exclusivos del SUPERADMIN
    const adminControls = isSuperUser() ? `
        <div class="post-admin-actions">
            <button class="admin-edit-btn" onclick="adminEditPost('${post._id}')" title="Editar publicación">
                ✏️ Editar
            </button>
            <button class="admin-pin-btn ${post.pinned ? 'pinned' : ''}" onclick="togglePin('${post._id}')" title="${post.pinned ? 'Desfijar' : 'Fijar arriba'}">
                ${post.pinned ? '📌 Fijado' : '📌 Fijar'}
            </button>
            <button class="admin-delete-btn" onclick="adminDeletePost('${post._id}')" title="Borrar publicación">
                🗑️ Borrar
            </button>
        </div>
    ` : '';
    
    if (post.pinned) {
        postCard.classList.add('post-pinned');
    }

    postCard.innerHTML = `
        ${post.pinned ? '<div class="pinned-banner">📌 Publicación fijada</div>' : ''}
        <div class="post-header">
            <div class="post-meta">
                <span class="post-author ${authorId ? 'clickable-author' : ''} ${isSuperAuthor ? 'superadmin-name' : ''}" ${authorId ? `onclick="viewProfile('${authorId}')"` : ''}>${authorLabel}</span>
                <span class="post-date">${formatDate(post.createdAt)}</span>
            </div>
            ${isSuperAuthor ? '' : `
            <div class="post-menu">
                <button class="post-menu-btn" onclick="togglePostMenu(event, '${post._id}')" title="Opciones">⋮</button>
                <div class="post-menu-dropdown hidden" id="post-menu-${post._id}">
                    <button class="post-menu-option" onclick="reportPost('${post._id}')">🚩 Reportar publicación</button>
                </div>
            </div>`}
        </div>

        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-description">${post.description}</p>
            ${imagesHtml}
        </div>

        <div class="post-actions">
            <div class="post-actions-left">
                <button class="like-btn ${userHasLiked ? 'liked' : ''}" onclick="toggleLike('${post._id}', this)" ${!currentUser ? 'disabled' : ''}>
                    <span class="like-icon">${userHasLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${likesCount}</span>
                </button>
                <button class="comment-btn" onclick="openCommentsModal('${post._id}')">
                    <span class="comment-icon">💬</span>
                    <span class="comment-count">${post.comments ? post.comments.length : 0}</span>
                </button>
            </div>
            ${adminControls}
        </div>
    `;

    return postCard;
}

// Función para mostrar imagen NSFW
function showNSFWImage(element, filename) {
    const imageItem = element.closest('.post-image-item');
    
    imageItem.innerHTML = `
        <img src="${imgSrc(filename)}" alt="Imagen de la publicación" class="post-image" onclick="openImageModal(this.src)">
    `;
}

// Función para abrir modal de imagen
function openImageModal(imageSrc) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeImageModal()">
            <div class="modal-content">
                <img src="${imageSrc}" alt="Imagen ampliada" class="modal-image">
                <button class="modal-close" onclick="closeImageModal()">×</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Función para cerrar modal de imagen
function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Array para almacenar las publicaciones
let posts = [];

// Variable para almacenar el usuario actual
let currentUser = null;

// Código de acceso del usuario actual (necesario para acciones de admin)
let currentAccessCode = localStorage.getItem('accessCode') || null;

// Array para almacenar las imágenes seleccionadas
let selectedImages = [];

// ==================== HELPERS DE ADMINISTRADOR (FRONTEND) ====================

// ¿El usuario actual tiene poderes de admin? (permanente o temporal vigente)
function isSuperUser() {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    if (currentUser.tempAdminUntil && new Date(currentUser.tempAdminUntil) > new Date()) return true;
    return false;
}

// Devuelve el HTML de un nombre de usuario con estilo dorado + corona si es superadmin
function renderAuthorName(userObj) {
    const name = userObj && userObj.username ? userObj.username : 'Usuario eliminado';
    const isSuper = userObj && userObj.role === 'superadmin';
    if (isSuper) {
        return `<span class="superadmin-name">👑 @${name}</span>`;
    }
    return `@${name}`;
}

// Cabeceras con el código de acceso para autenticar acciones de admin
function adminHeaders(extra = {}) {
    return Object.assign({ 'x-access-code': currentAccessCode || '' }, extra);
}

// Notificación flotante rápida
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Funciones de gestión de usuarios
function checkUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    const termsAccepted = localStorage.getItem('termsAccepted');
    
    // Siempre mostrar la landing page primero para que el usuario vea los términos
    if (!termsAccepted || termsAccepted !== 'true') {
        showLandingPage();
    } else if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserInterface();
    } else {
        showAuthScreen();
    }
}

function showLandingPage() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('termsPage').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('postForm').classList.add('hidden');
    document.querySelector('.post-list').classList.add('hidden');
    document.getElementById('newPostBtn').classList.add('hidden');
    document.getElementById('currentUser').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
}

function showTermsPage() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('termsPage').classList.remove('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('postForm').classList.add('hidden');
    document.querySelector('.post-list').classList.add('hidden');
    document.getElementById('newPostBtn').classList.add('hidden');
    document.getElementById('currentUser').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    
    // Reset checkbox and button state
    document.getElementById('acceptTerms').checked = false;
    document.getElementById('continueBtn').disabled = true;
}

function showAuthScreen() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('termsPage').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('postForm').classList.add('hidden');
    document.querySelector('.post-list').classList.add('hidden');
    document.getElementById('newPostBtn').classList.add('hidden');
    document.getElementById('currentUser').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    
    // Mostrar formulario de login por defecto
    showLoginForm();
}

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('accessCode').focus();
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    document.getElementById('username').focus();
}

function showUserInterface() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('termsPage').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.querySelector('.post-list').classList.remove('hidden');
    document.getElementById('newPostBtn').classList.remove('hidden');
    document.getElementById('currentUser').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');

    // Mostrar nombre (dorado + corona si es SUPERADMIN)
    const userEl = document.getElementById('currentUser');
    if (isSuperUser()) {
        userEl.innerHTML = `👑 @${currentUser.username}`;
        userEl.classList.add('superadmin-name');
    } else {
        userEl.textContent = `@${currentUser.username}`;
        userEl.classList.remove('superadmin-name');
    }

    // Mostrar u ocultar el botón del panel de admin
    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        adminBtn.classList.toggle('hidden', !isSuperUser());
    }

    loadPosts();
    startAutoRefresh(); // Feed en vivo: se actualiza solo cada 3s
    updateFreezeIndicator(); // Mostrar estado inicial (En vivo / Congelado)
}

function logout() {
    currentUser = null;
    currentAccessCode = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessCode');
    // Mantener términos aceptados para no tener que aceptarlos de nuevo
    showAuthScreen();
}

function proceedToAuth() {
    const termsCheckbox = document.getElementById('acceptTerms');
    
    if (!termsCheckbox.checked) {
        showError('Debes aceptar los términos y condiciones para continuar');
        return;
    }
    
    // Guardar que los términos fueron aceptados
    localStorage.setItem('termsAccepted', 'true');
    showAuthScreen();
}

// Función para manejar el checkbox de términos
function handleTermsCheckbox() {
    const checkbox = document.getElementById('acceptTerms');
    const continueBtn = document.getElementById('continueBtn');
    
    continueBtn.disabled = !checkbox.checked;
}

async function loginWithCode(accessCode) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessCode })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al iniciar sesión');
        }
        
        const loginData = await response.json();
        currentUser = loginData.user;
        localStorage.setItem('currentUser', JSON.stringify(loginData.user));
        // Guardar el código de acceso para poder autenticar acciones de admin
        currentAccessCode = accessCode;
        localStorage.setItem('accessCode', accessCode);
        showUserInterface();

        return true;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

async function createUser(username) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear el usuario');
        }
        
        const userData = await response.json();
        
        // Mostrar el modal con el código generado
        showAccessCodeModal(userData.accessCode);
        
        // Guardar usuario para después del modal
        currentUser = userData.user;
        
        return true;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
}

function showAccessCodeModal(accessCode) {
    const modal = document.getElementById('accessCodeModal');
    const codeInput = document.getElementById('generatedCode');
    
    codeInput.value = accessCode;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Auto-seleccionar el código para facilitar la copia
    codeInput.select();
}

function copyAccessCode() {
    const codeInput = document.getElementById('generatedCode');
    codeInput.select();
    document.execCommand('copy');
    
    // Cambiar temporalmente el texto del botón
    const copyBtn = document.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copiado';
    copyBtn.style.background = '#10b981';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
    }, 2000);
}

function confirmCodeSaved() {
    const modal = document.getElementById('accessCodeModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    
    // Guardar el usuario en localStorage y mostrar la interfaz
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showUserInterface();
}

// Función para formatear automáticamente el código de acceso
function formatAccessCode(input) {
    // Remover todo excepto letras y números
    let value = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Agregar guiones cada 4 caracteres
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += '-';
        }
        formattedValue += value[i];
    }
    
    // Limitar a 19 caracteres (16 + 3 guiones)
    input.value = formattedValue.substring(0, 19);
}

async function viewProfile(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error('Error al cargar el perfil');
        }
        
        const profileData = await response.json();
        showProfileModal(profileData);
        
    } catch (error) {
        console.error('Error al ver perfil:', error);
        showError('Error al cargar el perfil del usuario');
    }
}

function showProfileModal(profileData) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal';
    
    const postsHtml = profileData.posts.map(post => {
        const imageHtml = post.image ? `
            <div class="post-image-container">
                <img src="${imgSrc(post.image)}" alt="Imagen de la publicación" class="post-image-small">
            </div>
        ` : '';
        
        return `
            <div class="profile-post">
                <h4 class="post-title">${post.title}</h4>
                <p class="post-description">${post.description}</p>
                ${imageHtml}
                <span class="post-date">${formatDate(post.createdAt)}</span>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeProfileModal()">
            <div class="modal-content profile-content" onclick="event.stopPropagation()">
                <div class="profile-header">
                    <h2>@${profileData.user.username}</h2>
                    <button class="modal-close" onclick="closeProfileModal()">×</button>
                </div>
                <div class="profile-stats">
                    <span>${profileData.totalPosts} publicaciones</span>
                    <span>Miembro desde ${formatDate(profileData.user.createdAt)}</span>
                </div>
                <div class="profile-posts">
                    <h3>Publicaciones</h3>
                    ${postsHtml || '<p>No hay publicaciones aún</p>'}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
    const modal = document.querySelector('.profile-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Funciones para comentarios
function createModalCommentHTML(comment, postId) {
    const commentLikesCount = comment.likes ? comment.likes.length : 0;
    const userHasLikedComment = comment.likes && currentUser ? comment.likes.some(like => like.userId === currentUser._id) : false;
    const isSuperAuthor = comment.userId && comment.userId.role === 'superadmin';
    const authorName = comment.userId && comment.userId.username ? comment.userId.username : 'Usuario eliminado';
    const authorLabel = isSuperAuthor ? `👑 @${authorName}` : `@${authorName}`;

    const adminDelete = isSuperUser() ? `
                <button class="modal-admin-delete" onclick="adminDeleteComment('${postId}', '${comment._id}')" title="Borrar comentario">🗑️</button>
    ` : '';

    const repliesHTML = comment.replies ? comment.replies.map(reply => createModalReplyHTML(reply, postId, comment._id)).join('') : '';

    return `
        <div class="modal-comment" data-comment-id="${comment._id}">
            <div class="modal-comment-header">
                <span class="modal-comment-author ${isSuperAuthor ? 'superadmin-name' : ''}">${authorLabel}</span>
                <span class="modal-comment-date">${formatDate(comment.createdAt)}</span>
            </div>
            <div class="modal-comment-content">
                <p>${comment.content}</p>
            </div>
            <div class="modal-comment-actions">
                <button class="modal-comment-like-btn ${userHasLikedComment ? 'liked' : ''}" onclick="toggleModalCommentLike('${postId}', '${comment._id}', this)" ${!currentUser ? 'disabled' : ''}>
                    <span class="like-icon">${userHasLikedComment ? '❤️' : '🤍'}</span>
                    <span class="like-count">${commentLikesCount}</span>
                </button>
                <button class="modal-reply-btn" onclick="toggleModalReplyForm('${postId}', '${comment._id}')" ${!currentUser ? 'disabled' : ''}>
                    Responder
                </button>
                ${adminDelete}
            </div>
            <div class="modal-reply-form hidden" id="modal-reply-form-${comment._id}">
                <textarea class="modal-reply-input" placeholder="Escribe una respuesta..." maxlength="1000"></textarea>
                <button class="modal-reply-submit" onclick="submitModalReply('${postId}', '${comment._id}', this)">Responder</button>
            </div>
            <div class="modal-replies-list">
                ${repliesHTML}
            </div>
        </div>
    `;
}

function createModalReplyHTML(reply, postId, commentId) {
    const replyLikesCount = reply.likes ? reply.likes.length : 0;
    const userHasLikedReply = reply.likes && currentUser ? reply.likes.some(like => like.userId === currentUser._id) : false;
    const isSuperAuthor = reply.userId && reply.userId.role === 'superadmin';
    const authorName = reply.userId && reply.userId.username ? reply.userId.username : 'Usuario eliminado';
    const authorLabel = isSuperAuthor ? `👑 @${authorName}` : `@${authorName}`;

    const adminDelete = isSuperUser() ? `
                <button class="modal-admin-delete" onclick="adminDeleteReply('${postId}', '${commentId}', '${reply._id}')" title="Borrar respuesta">🗑️</button>
    ` : '';

    return `
        <div class="modal-reply" data-reply-id="${reply._id}">
            <div class="modal-reply-header">
                <span class="modal-reply-author ${isSuperAuthor ? 'superadmin-name' : ''}">${authorLabel}</span>
                <span class="modal-reply-date">${formatDate(reply.createdAt)}</span>
            </div>
            <div class="modal-reply-content">
                <p>${reply.content}</p>
            </div>
            <div class="modal-reply-actions">
                <button class="modal-reply-like-btn ${userHasLikedReply ? 'liked' : ''}" onclick="toggleModalReplyLike('${postId}', '${commentId}', '${reply._id}', this)" ${!currentUser ? 'disabled' : ''}>
                    <span class="like-icon">${userHasLikedReply ? '❤️' : '🤍'}</span>
                    <span class="like-count">${replyLikesCount}</span>
                </button>
                <button class="modal-reply-to-btn" onclick="replyToReply('${postId}', '${commentId}', '${reply._id}')" ${!currentUser ? 'disabled' : ''}>
                    Responder
                </button>
                ${adminDelete}
            </div>
        </div>
    `;
}

function createReplyHTML(reply, postId, commentId) {
    const replyLikesCount = reply.likes ? reply.likes.length : 0;
    const userHasLikedReply = reply.likes && currentUser ? reply.likes.some(like => like.userId === currentUser._id) : false;
    const authorName = reply.userId && reply.userId.username ? reply.userId.username : 'Usuario eliminado';
    
    return `
        <div class="reply" data-reply-id="${reply._id}">
            <div class="reply-header">
                <span class="reply-author">@${authorName}</span>
                <span class="reply-date">${formatDate(reply.createdAt)}</span>
            </div>
            <div class="reply-content">
                <p>${reply.content}</p>
            </div>
            <div class="reply-actions">
                <button class="reply-like-btn ${userHasLikedReply ? 'liked' : ''}" onclick="toggleReplyLike('${postId}', '${commentId}', '${reply._id}', this)" ${!currentUser ? 'disabled' : ''}>
                    <span class="like-icon">${userHasLikedReply ? '❤️' : '🤍'}</span>
                    <span class="like-count">${replyLikesCount}</span>
                </button>
            </div>
        </div>
    `;
}

function openCommentsModal(postId) {
    // Buscar el post en el array local
    const post = posts.find(p => p._id === postId);
    if (!post) {
        showError('Post no encontrado');
        return;
    }
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'comments-modal';
    modal.id = `comments-modal-${postId}`;
    
    // Crear el contenido del post para contexto
    const authorName = post.userId && post.userId.username ? post.userId.username : 'Usuario eliminado';
    const authorId = post.userId && post.userId._id ? post.userId._id : null;
    
    const imagesHtml = post.images && post.images.length > 0 ? `
        <div class="modal-post-images-container">
            ${post.images.map((imageObj, index) => `
                <div class="modal-post-image-item">
                    ${imageObj.isNSFW ? `
                        <div class="nsfw-overlay-small">
                            <span class="nsfw-icon">⚠️</span>
                            <p>Contenido NSFW</p>
                        </div>
                    ` : `
                        <img src="${imgSrc(imageObj.filename)}" alt="Imagen ${index + 1} de la publicación" class="modal-post-image">
                    `}
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Ordenar comentarios por likes (más likes primero)
    const sortedComments = post.comments ? [...post.comments].sort((a, b) => {
        const aLikes = a.likes ? a.likes.length : 0;
        const bLikes = b.likes ? b.likes.length : 0;
        return bLikes - aLikes;
    }) : [];
    
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeCommentsModal('${postId}')">
            <div class="modal-content comments-modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Comentarios</h3>
                    <button class="modal-close-btn" onclick="closeCommentsModal('${postId}')">✖️</button>
                </div>
                
                <div class="modal-post-context">
                    <div class="modal-post-header">
                        <span class="modal-post-author ${authorId ? 'clickable-author' : ''}" ${authorId ? `onclick="viewProfile('${authorId}')"` : ''}>@${authorName}</span>
                        <span class="modal-post-date">${formatDate(post.createdAt)}</span>
                    </div>
                    <div class="modal-post-content">
                        <h4 class="modal-post-title">${post.title}</h4>
                        <p class="modal-post-description">${post.description}</p>
                        ${imagesHtml}
                    </div>
                </div>
                
                <div class="modal-comments-section">
                    <div class="modal-comment-form" ${!currentUser ? 'style="display: none;"' : ''}>
                        <textarea class="modal-comment-input" placeholder="Escribe un comentario..." maxlength="1000"></textarea>
                        <button class="modal-comment-submit" onclick="submitModalComment('${postId}', this)">Comentar</button>
                    </div>
                    
                    <div class="modal-comments-list" id="modal-comments-list-${postId}">
                        ${sortedComments.map(comment => createModalCommentHTML(comment, postId)).join('')}
                        ${sortedComments.length === 0 ? '<p class="no-comments">No hay comentarios aún. ¡Sé el primero en comentar!</p>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Animación de entrada
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeCommentsModal(postId) {
    const modal = document.getElementById(`comments-modal-${postId}`);
    if (modal) {
        modal.classList.add('hide');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

async function submitModalComment(postId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para comentar');
        return;
    }
    
    const commentForm = buttonElement.parentElement;
    const textarea = commentForm.querySelector('.modal-comment-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showError('El comentario no puede estar vacío');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Comentando...';
        
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: currentUser._id,
                content: content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear el comentario');
        }
        
        const data = await response.json();
        
        // Limpiar el textarea
        textarea.value = '';
        
        // Agregar el nuevo comentario al principio de la lista del modal
        const commentsList = document.getElementById(`modal-comments-list-${postId}`);
        const noCommentsMsg = commentsList.querySelector('.no-comments');
        if (noCommentsMsg) {
            noCommentsMsg.remove();
        }
        
        const commentHTML = createModalCommentHTML(data.comment, postId);
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
        
        // Actualizar el contador de comentarios en el feed
        const commentCountElements = document.querySelectorAll(`.comment-count`);
        commentCountElements.forEach(element => {
            const postCard = element.closest('.post-card');
            if (postCard && postCard.querySelector(`[onclick*="${postId}"]`)) {
                element.textContent = data.commentsCount;
            }
        });
        
        // Actualizar el post en el array local
        const postIndex = posts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
            if (!posts[postIndex].comments) {
                posts[postIndex].comments = [];
            }
            posts[postIndex].comments.push(data.comment);
        }
        
    } catch (error) {
        console.error('Error al crear comentario:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Comentar';
    }
}

function toggleModalReplyForm(postId, commentId) {
    const replyForm = document.getElementById(`modal-reply-form-${commentId}`);
    replyForm.classList.toggle('hidden');

    if (!replyForm.classList.contains('hidden')) {
        const textarea = replyForm.querySelector('.modal-reply-input');
        textarea.focus();
    }
}

// Responder a una respuesta: abre el formulario del comentario y pre-llena con @usuario
function replyToReply(postId, commentId, replyId) {
    if (!currentUser) {
        showError('Debes estar logueado para responder');
        return;
    }
    // Obtener el nombre del autor de la respuesta desde el DOM (evita problemas con comillas)
    let mention = '';
    const replyEl = document.querySelector(`.modal-reply[data-reply-id="${replyId}"]`);
    if (replyEl) {
        const authorEl = replyEl.querySelector('.modal-reply-author');
        if (authorEl) {
            let name = authorEl.textContent.trim().replace(/^👑\s*/, ''); // quitar corona si es admin
            if (name.startsWith('@')) name = name.slice(1);
            if (name && name !== 'Usuario eliminado') mention = '@' + name + ' ';
        }
    }
    // Abrir el formulario de respuesta del comentario y pre-llenar
    const replyForm = document.getElementById(`modal-reply-form-${commentId}`);
    if (replyForm) {
        replyForm.classList.remove('hidden');
        const textarea = replyForm.querySelector('.modal-reply-input');
        if (textarea) {
            textarea.value = mention;
            textarea.focus();
            // Colocar el cursor al final
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

async function submitModalReply(postId, commentId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para responder');
        return;
    }
    
    const replyForm = buttonElement.parentElement;
    const textarea = replyForm.querySelector('.modal-reply-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showError('La respuesta no puede estar vacía');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Respondiendo...';
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: currentUser._id,
                content: content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la respuesta');
        }
        
        const data = await response.json();
        
        // Limpiar el textarea y ocultar el formulario
        textarea.value = '';
        replyForm.classList.add('hidden');
        
        // Agregar la nueva respuesta a la lista
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        const repliesList = comment.querySelector('.modal-replies-list');
        const replyHTML = createModalReplyHTML(data.reply, postId, commentId);
        repliesList.insertAdjacentHTML('beforeend', replyHTML);
        
    } catch (error) {
        console.error('Error al crear respuesta:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Responder';
    }
}

async function toggleModalCommentLike(postId, commentId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para dar like');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el like');
        }
        
        const data = await response.json();
        
        // Actualizar el botón
        const likeIcon = buttonElement.querySelector('.like-icon');
        const likeCount = buttonElement.querySelector('.like-count');
        
        if (data.liked) {
            buttonElement.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            buttonElement.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
        
        likeCount.textContent = data.likesCount;
        
    } catch (error) {
        console.error('Error al dar like al comentario:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
    }
}

async function toggleModalReplyLike(postId, commentId, replyId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para dar like');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el like');
        }
        
        const data = await response.json();
        
        // Actualizar el botón
        const likeIcon = buttonElement.querySelector('.like-icon');
        const likeCount = buttonElement.querySelector('.like-count');
        
        if (data.liked) {
            buttonElement.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            buttonElement.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
        
        likeCount.textContent = data.likesCount;
        
    } catch (error) {
        console.error('Error al dar like a la respuesta:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
    }
}

async function submitComment(postId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para comentar');
        return;
    }
    
    const commentForm = buttonElement.parentElement;
    const textarea = commentForm.querySelector('.comment-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showError('El comentario no puede estar vacío');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Comentando...';
        
        const response = await fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: currentUser._id,
                content: content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear el comentario');
        }
        
        const data = await response.json();
        
        // Limpiar el textarea
        textarea.value = '';
        
        // Agregar el nuevo comentario a la lista
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const commentHTML = createCommentHTML(data.comment, postId);
        commentsList.insertAdjacentHTML('beforeend', commentHTML);
        
        // Actualizar el contador de comentarios
        const commentCountElement = buttonElement.closest('.post-card').querySelector('.comment-count');
        commentCountElement.textContent = data.commentsCount;
        
        // Actualizar el post en el array local
        const postIndex = posts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
            if (!posts[postIndex].comments) {
                posts[postIndex].comments = [];
            }
            posts[postIndex].comments.push(data.comment);
        }
        
    } catch (error) {
        console.error('Error al crear comentario:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Comentar';
    }
}

function toggleReplyForm(postId, commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    replyForm.classList.toggle('hidden');
    
    if (!replyForm.classList.contains('hidden')) {
        const textarea = replyForm.querySelector('.reply-input');
        textarea.focus();
    }
}

async function submitReply(postId, commentId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para responder');
        return;
    }
    
    const replyForm = buttonElement.parentElement;
    const textarea = replyForm.querySelector('.reply-input');
    const content = textarea.value.trim();
    
    if (!content) {
        showError('La respuesta no puede estar vacía');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Respondiendo...';
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: currentUser._id,
                content: content
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la respuesta');
        }
        
        const data = await response.json();
        
        // Limpiar el textarea y ocultar el formulario
        textarea.value = '';
        replyForm.classList.add('hidden');
        
        // Agregar la nueva respuesta a la lista
        const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
        const repliesList = comment.querySelector('.replies-list');
        const replyHTML = createReplyHTML(data.reply, postId, commentId);
        repliesList.insertAdjacentHTML('beforeend', replyHTML);
        
    } catch (error) {
        console.error('Error al crear respuesta:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
        buttonElement.textContent = 'Responder';
    }
}

async function toggleCommentLike(postId, commentId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para dar like');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el like');
        }
        
        const data = await response.json();
        
        // Actualizar el botón
        const likeIcon = buttonElement.querySelector('.like-icon');
        const likeCount = buttonElement.querySelector('.like-count');
        
        if (data.liked) {
            buttonElement.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            buttonElement.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
        
        likeCount.textContent = data.likesCount;
        
    } catch (error) {
        console.error('Error al dar like al comentario:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
    }
}

async function toggleReplyLike(postId, commentId, replyId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para dar like');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el like');
        }
        
        const data = await response.json();
        
        // Actualizar el botón
        const likeIcon = buttonElement.querySelector('.like-icon');
        const likeCount = buttonElement.querySelector('.like-count');
        
        if (data.liked) {
            buttonElement.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            buttonElement.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
        
        likeCount.textContent = data.likesCount;
        
    } catch (error) {
        console.error('Error al dar like a la respuesta:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
    }
}



// Función para manejar likes
async function toggleLike(postId, buttonElement) {
    if (!currentUser) {
        showError('Debes estar logueado para dar like');
        return;
    }
    
    try {
        buttonElement.disabled = true;
        
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al procesar el like');
        }
        
        const data = await response.json();
        
        // Actualizar el botón
        const likeIcon = buttonElement.querySelector('.like-icon');
        const likeCount = buttonElement.querySelector('.like-count');
        
        if (data.liked) {
            buttonElement.classList.add('liked');
            likeIcon.textContent = '❤️';
        } else {
            buttonElement.classList.remove('liked');
            likeIcon.textContent = '🤍';
        }
        
        likeCount.textContent = data.likesCount;
        
        // Actualizar el post en el array local
        const postIndex = posts.findIndex(p => p._id === postId);
        if (postIndex !== -1) {
            posts[postIndex] = data.post;
        }
        
    } catch (error) {
        console.error('Error al dar like:', error);
        showError(error.message);
    } finally {
        buttonElement.disabled = false;
    }
}

// Función para cargar publicaciones
// Firma del feed: resumen compacto para detectar si algo cambió (sin re-dibujar de más)
function feedSignature(list) {
    return (list || []).map(p =>
        p._id + ':' +
        (p.likes ? p.likes.length : 0) + ':' +
        (p.comments ? p.comments.length : 0) + ':' +
        (p.pinned ? 1 : 0) + ':' +
        (p.title || '').length + ':' +
        (p.description || '').length + ':' +
        (p.images ? p.images.length : 0)
    ).join('|');
}

let lastFeedSignature = '';

// Dibuja el array `posts` en el contenedor (sin spinner). Se usa en cargas y auto-refresh.
function renderPosts() {
    const emptyState = document.getElementById('emptyState');
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    postsContainer.innerHTML = '';
    if (!posts || posts.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        posts.forEach(post => {
            const postCard = createPostCard(post);
            postCard.dataset.postId = post._id;
            postsContainer.appendChild(postCard);
        });
    }
    lastFeedSignature = feedSignature(posts);
}

// Carga inicial (con spinner)
async function loadPosts() {
    const loadingContainer = document.getElementById('loadingContainer');
    const emptyState = document.getElementById('emptyState');
    const postsContainer = document.getElementById('postsContainer');

    loadingContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    postsContainer.innerHTML = '';

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
            throw new Error('Error al cargar las publicaciones');
        }
        posts = await response.json();
        renderPosts();
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        showError('Error al cargar las publicaciones. Verifica que el servidor esté ejecutándose.');
    } finally {
        loadingContainer.classList.add('hidden');
    }
}

// ==================== AUTO-REFRESH INTELIGENTE DEL FEED ====================

let autoRefreshTimer = null;

// ¿Hay algo abierto que NO debemos interrumpir con un refresco?
function isInteractionOpen() {
    if (document.querySelector('.comments-modal')) return true;   // modal de comentarios
    if (document.querySelector('.image-modal')) return true;       // imagen ampliada
    if (document.querySelector('.profile-modal')) return true;     // perfil
    const adminPanel = document.getElementById('adminPanelModal');
    if (adminPanel && !adminPanel.classList.contains('hidden')) return true;
    const adminEdit = document.getElementById('adminEditModal');
    if (adminEdit && !adminEdit.classList.contains('hidden')) return true;
    const postForm = document.getElementById('postForm');
    if (postForm && !postForm.classList.contains('hidden')) return true; // escribiendo un post
    if (document.querySelector('.post-menu-dropdown:not(.hidden)')) return true; // menú ⋮ abierto
    return false;
}

// Un ciclo de refresco: solo actúa si tiene sentido y solo re-dibuja si algo cambió
async function autoRefreshFeed() {
    if (!currentUser) return;                       // solo si hay sesión
    if (document.hidden) return;                    // pestaña en segundo plano → no gastar
    const postList = document.querySelector('.post-list');
    if (!postList || postList.classList.contains('hidden')) return; // feed no visible
    updateFreezeIndicator();                        // estado "En vivo/Congelado" para todos
    if (isInteractionOpen()) return;                // no interrumpir al usuario

    try {
        const response = await fetch('/api/posts');
        if (!response.ok) return;
        const fresh = await response.json();
        const sig = feedSignature(fresh);
        if (sig === lastFeedSignature) return;      // nada cambió → NO tocar el DOM (sin parpadeo)
        posts = fresh;
        renderPosts();
    } catch (e) {
        // Silencioso: un fallo de red puntual no debe molestar
    }
}

function startAutoRefresh() {
    if (autoRefreshTimer) return;
    autoRefreshTimer = setInterval(autoRefreshFeed, 3000); // cada 3 segundos
    // Al volver a la pestaña, refrescar de inmediato
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) autoRefreshFeed();
    });
}

// Función para crear nueva publicación
async function createPost(formData) {
    try {
        // Agregar el userId del usuario actual
        formData.append('userId', currentUser._id);
        
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al crear la publicación');
        }
        
        const newPost = await response.json();
        posts.unshift(newPost); // Agregar al inicio del array
        
        // Actualizar la UI
        const postsContainer = document.getElementById('postsContainer');
        const emptyState = document.getElementById('emptyState');
        
        emptyState.classList.add('hidden');
        
        const postCard = createPostCard(newPost);
        postCard.dataset.postId = newPost._id;
        postsContainer.insertBefore(postCard, postsContainer.firstChild);
        
        return true;
    } catch (error) {
        console.error('Error al crear publicación:', error);
        throw error;
    }
}

// Manejar envío del formulario
document.getElementById('newPostForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';
    hideError();
    
    try {
        const formData = new FormData();
        formData.append('title', filterOffensiveContent(document.getElementById('postTitle').value));
        formData.append('description', filterOffensiveContent(document.getElementById('postDescription').value));
        
        // Usar el array de imágenes seleccionadas
        if (selectedImages.length > 0) {
            selectedImages.forEach(file => {
                formData.append('images', file);
            });
        }
        
        await createPost(formData);
        hidePostForm();
        
    } catch (error) {
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Manejar envío del formulario de login
document.getElementById('loginUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    const errorDiv = document.getElementById('loginErrorMessage');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';
    errorDiv.classList.add('hidden');
    
    try {
        const accessCode = document.getElementById('accessCode').value.trim();
        await loginWithCode(accessCode);
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Manejar envío del formulario de registro
document.getElementById('createUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    const errorDiv = document.getElementById('userErrorMessage');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';
    errorDiv.classList.add('hidden');
    
    try {
        const username = document.getElementById('username').value.trim();
        await createUser(username);
        
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Formatear automáticamente el código de acceso mientras se escribe
document.getElementById('accessCode').addEventListener('input', function() {
    formatAccessCode(this);
});

// Manejar checkbox de términos y condiciones
document.getElementById('acceptTerms').addEventListener('change', handleTermsCheckbox);

// Verificar sesión de usuario al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkUserSession();
});

// Agregar estilos para modales y nuevas funcionalidades
const modalStyles = `
    .image-modal, .profile-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 3000;
    }
    
    .modal-overlay {
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .modal-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
    }
    
    .modal-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 12px;
    }
    
    .modal-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: none;
        border: none;
        color: #ffffff;
        font-size: 32px;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .modal-close:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }
    
    .profile-content {
        background: #000;
        border-radius: 16px;
        padding: 24px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        color: #fff;
    }
    
    .profile-header {
        display: flex;
        justify-content: between;
        align-items: center;
        margin-bottom: 16px;
        border-bottom: 1px solid #333;
        padding-bottom: 16px;
    }
    
    .profile-header h2 {
        margin: 0;
        color: #1da1f2;
    }
    
    .profile-stats {
        display: flex;
        gap: 24px;
        margin-bottom: 24px;
        color: #8b98a5;
        font-size: 14px;
    }
    
    .profile-posts h3 {
        color: #fff;
        margin-bottom: 16px;
        border-bottom: 1px solid #333;
        padding-bottom: 8px;
    }
    
    .profile-post {
        background: #111;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #333;
    }
    
    .profile-post h4 {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 16px;
    }
    
    .profile-post p {
        margin: 0 0 12px 0;
        color: #8b98a5;
        font-size: 14px;
    }
    
    .post-image-small {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin-bottom: 8px;
    }
    
    .clickable-author {
        cursor: pointer;
        color: #1da1f2 !important;
        transition: color 0.2s;
    }
    
    .clickable-author:hover {
        color: #1a8cd8 !important;
        text-decoration: underline;
    }
    
    .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .current-user {
        color: #1da1f2;
        font-weight: 500;
    }
    
    .logout-btn {
        background: #1a1a1a;
        color: #fff;
        border: 1px solid #333;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }
    
    .logout-btn:hover {
        background: #333;
    }
    
    .post-actions {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 12px 0 0 0;
        border-top: 1px solid #333;
        margin-top: 12px;
    }
    
    .like-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .like-btn:hover:not(:disabled) {
        background: rgba(249, 24, 128, 0.1);
        color: #f91880;
    }
    
    .like-btn.liked {
        color: #f91880;
    }
    
    .like-btn.liked:hover {
        background: rgba(249, 24, 128, 0.1);
    }
    
    .like-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .like-icon {
        font-size: 16px;
    }
    
    .like-count {
        font-weight: 500;
        min-width: 20px;
        text-align: left;
    }
    
    .comment-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        transition: all 0.2s;
        margin-left: 12px;
    }
    
    .comment-btn:hover {
        background: rgba(29, 161, 242, 0.1);
        color: #1da1f2;
    }
    
    .comment-icon {
        font-size: 16px;
    }
    
    .comment-count {
        font-weight: 500;
        min-width: 20px;
        text-align: left;
    }
    
    .comments-section {
        border-top: 1px solid #333;
        margin-top: 12px;
        padding-top: 16px;
    }
    
    .comment-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
        padding: 16px;
        background: #111;
        border-radius: 12px;
        border: 1px solid #333;
    }
    
    .comment-input, .reply-input {
        background: #000;
        border: 1px solid #333;
        border-radius: 8px;
        color: #fff;
        padding: 12px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        min-height: 60px;
    }
    
    .comment-input:focus, .reply-input:focus {
        outline: none;
        border-color: #1da1f2;
    }
    
    .comment-submit, .reply-submit {
        align-self: flex-end;
        background: #1da1f2;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    
    .comment-submit:hover, .reply-submit:hover {
        background: #1a8cd8;
    }
    
    .comment-submit:disabled, .reply-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .comment {
        background: #111;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid #333;
    }
    
    .comment-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }
    
    .comment-author {
        color: #1da1f2;
        font-weight: 500;
        font-size: 14px;
    }
    
    .comment-date {
        color: #8b98a5;
        font-size: 12px;
    }
    
    .comment-content p {
        margin: 0;
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .comment-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 12px;
    }
    
    .comment-like-btn, .reply-like-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .comment-like-btn:hover:not(:disabled), .reply-like-btn:hover:not(:disabled) {
        background: rgba(249, 24, 128, 0.1);
        color: #f91880;
    }
    
    .comment-like-btn.liked, .reply-like-btn.liked {
        color: #f91880;
    }
    
    .comment-like-btn:disabled, .reply-like-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .reply-btn {
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 16px;
        font-size: 12px;
        transition: all 0.2s;
    }
    
    .reply-btn:hover:not(:disabled) {
        background: rgba(29, 161, 242, 0.1);
        color: #1da1f2;
    }
    
    .reply-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .reply-form {
        margin-top: 12px;
        padding: 12px;
        background: #0a0a0a;
        border-radius: 8px;
        border: 1px solid #333;
    }
    
    .reply {
        background: #0a0a0a;
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0 8px 24px;
        border: 1px solid #333;
        border-left: 3px solid #1da1f2;
    }
    
    .reply-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 6px;
    }
    
    .reply-author {
        color: #1da1f2;
        font-weight: 500;
        font-size: 13px;
    }
    
    .reply-date {
        color: #8b98a5;
        font-size: 11px;
    }
    
    .reply-content p {
        margin: 0;
        color: #fff;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .reply-actions {
        display: flex;
        align-items: center;
        margin-top: 8px;
    }
    
    .replies-list {
        margin-top: 8px;
    }
    
    /* Estilos para el modal de comentarios */
    .comments-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 4000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .comments-modal.show {
        opacity: 1;
        visibility: visible;
    }
    
    .comments-modal.hide {
        opacity: 0;
        visibility: hidden;
    }
    
    .comments-modal .modal-overlay {
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .comments-modal-content {
        background: #000;
        border-radius: 16px;
        width: 100%;
        max-width: 700px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        border: 1px solid #333;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .comments-modal.show .comments-modal-content {
        transform: scale(1);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 16px 24px;
        border-bottom: 1px solid #333;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #fff;
        font-size: 20px;
        font-weight: 700;
    }
    
    .modal-close-btn {
        background: none;
        border: none;
        color: #8b98a5;
        font-size: 18px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .modal-close-btn:hover {
        background: rgba(139, 152, 165, 0.1);
        color: #fff;
    }
    
    .modal-post-context {
        padding: 20px 24px;
        border-bottom: 1px solid #333;
    }
    
    .modal-post-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .modal-post-author {
        color: #1da1f2;
        font-weight: 500;
        font-size: 15px;
    }
    
    .modal-post-date {
        color: #8b98a5;
        font-size: 13px;
    }
    
    .modal-post-title {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3;
    }
    
    .modal-post-description {
        margin: 0 0 12px 0;
        color: #fff;
        font-size: 15px;
        line-height: 1.4;
    }
    
    .modal-post-image-container {
        margin-top: 12px;
    }
    
    .modal-post-image {
        width: 100%;
        max-height: 300px;
        object-fit: cover;
        border-radius: 12px;
    }
    
    .nsfw-overlay-small {
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        color: #fff;
    }
    
    .modal-comments-section {
        flex: 1;
        overflow-y: auto;
        padding: 0;
    }
    
    .modal-comment-form {
        padding: 20px 24px;
        border-bottom: 1px solid #333;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .modal-comment-input, .modal-reply-input {
        background: #111;
        border: 1px solid #333;
        border-radius: 12px;
        color: #fff;
        padding: 16px;
        font-family: inherit;
        font-size: 15px;
        resize: vertical;
        min-height: 80px;
        transition: border-color 0.2s;
    }
    
    .modal-comment-input:focus, .modal-reply-input:focus {
        outline: none;
        border-color: #1da1f2;
    }
    
    .modal-comment-submit, .modal-reply-submit {
        align-self: flex-end;
        background: #1da1f2;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    
    .modal-comment-submit:hover, .modal-reply-submit:hover {
        background: #1a8cd8;
    }
    
    .modal-comment-submit:disabled, .modal-reply-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .modal-comments-list {
        padding: 0 24px 24px 24px;
    }
    
    .no-comments {
        text-align: center;
        color: #8b98a5;
        font-style: italic;
        padding: 40px 20px;
        margin: 0;
    }
    
    .modal-comment {
        background: #111;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid #333;
    }
    
    .modal-comment-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .modal-comment-author {
        color: #1da1f2;
        font-weight: 500;
        font-size: 15px;
    }
    
    .modal-comment-date {
        color: #8b98a5;
        font-size: 13px;
    }
    
    .modal-comment-content p {
        margin: 0 0 12px 0;
        color: #fff;
        font-size: 15px;
        line-height: 1.4;
    }
    
    .modal-comment-actions {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 12px;
    }
    
    .modal-comment-like-btn, .modal-reply-like-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 18px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .modal-comment-like-btn:hover:not(:disabled), .modal-reply-like-btn:hover:not(:disabled) {
        background: rgba(249, 24, 128, 0.1);
        color: #f91880;
    }
    
    .modal-comment-like-btn.liked, .modal-reply-like-btn.liked {
        color: #f91880;
    }
    
    .modal-reply-btn {
        background: none;
        border: none;
        color: #8b98a5;
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 18px;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .modal-reply-btn:hover:not(:disabled) {
        background: rgba(29, 161, 242, 0.1);
        color: #1da1f2;
    }
    
    .modal-reply-form {
        margin-top: 12px;
        padding: 16px;
        background: #0a0a0a;
        border-radius: 12px;
        border: 1px solid #333;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .modal-reply {
        background: #0a0a0a;
        border-radius: 12px;
        padding: 12px 16px;
        margin: 12px 0 12px 32px;
        border: 1px solid #333;
        border-left: 3px solid #1da1f2;
    }
    
    .modal-reply-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
    }
    
    .modal-reply-author {
        color: #1da1f2;
        font-weight: 500;
        font-size: 14px;
    }
    
    .modal-reply-date {
        color: #8b98a5;
        font-size: 12px;
    }
    
    .modal-reply-content p {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .modal-reply-actions {
        display: flex;
        align-items: center;
        margin-top: 8px;
    }
    
    .modal-replies-list {
        margin-top: 8px;
    }
    
    /* Responsive design para el modal */
    @media (max-width: 768px) {
        .comments-modal .modal-overlay {
            padding: 10px;
        }
        
        .comments-modal-content {
            max-height: 95vh;
        }
        
        .modal-header {
            padding: 16px 20px 12px 20px;
        }
        
        .modal-post-context {
            padding: 16px 20px;
        }
        
        .modal-comments-list {
            padding: 0 20px 20px 20px;
        }
        
        .modal-comment-form {
            padding: 16px 20px;
        }
        
        .modal-reply {
            margin-left: 20px;
        }
    }
    
    /* Estilos para la pantalla de autenticación */
    .auth-screen {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 70vh;
        padding: 20px;
    }
    
    .auth-form {
        background: #111;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 100%;
        border: 1px solid #333;
    }
    
    .auth-header {
        text-align: center;
        margin-bottom: 24px;
    }
    
    .auth-header h2 {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 24px;
        font-weight: 700;
    }
    
    .auth-description {
        margin: 0;
        color: #8b98a5;
        font-size: 14px;
    }
    
    .form-group {
        margin-bottom: 20px;
    }
    
    .form-group label {
        display: block;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
    }
    
    .form-group input {
        width: 100%;
        background: #000;
        border: 2px solid #333;
        border-radius: 8px;
        color: #fff;
        padding: 12px 16px;
        font-size: 16px;
        font-family: inherit;
        transition: border-color 0.2s;
        box-sizing: border-box;
    }
    
    .form-group input:focus {
        outline: none;
        border-color: #1da1f2;
    }
    
    .input-help {
        display: block;
        color: #8b98a5;
        font-size: 12px;
        margin-top: 4px;
    }
    
    .form-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 24px;
    }
    
    .secondary-btn {
        background: none;
        color: #1da1f2;
        border: 1px solid #1da1f2;
        padding: 12px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
    }
    
    .secondary-btn:hover {
        background: rgba(29, 161, 242, 0.1);
    }
    
    /* Estilos para el modal de código de acceso */
    .access-code-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5000;
        padding: 20px;
    }
    
    .access-code-modal .modal-content {
        background: #000;
        border-radius: 16px;
        padding: 32px;
        max-width: 600px;
        width: 100%;
        border: 2px solid #1da1f2;
        max-height: 90vh;
        overflow-y: auto;
    }
    
    .access-code-modal .modal-header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 1px solid #333;
        padding-bottom: 16px;
    }
    
    .access-code-modal .modal-header h3 {
        margin: 0;
        color: #1da1f2;
        font-size: 24px;
        font-weight: 700;
    }
    
    .access-code-display {
        margin-bottom: 24px;
    }
    
    .access-code-display label {
        display: block;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 12px;
    }
    
    .code-container {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    
    .generated-code {
        flex: 1;
        background: #111;
        border: 2px solid #1da1f2;
        border-radius: 8px;
        color: #1da1f2;
        padding: 16px;
        font-size: 18px;
        font-weight: 600;
        font-family: 'Courier New', monospace;
        text-align: center;
        letter-spacing: 2px;
    }
    
    .copy-btn {
        background: #1da1f2;
        color: #fff;
        border: none;
        padding: 16px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
        white-space: nowrap;
    }
    
    .copy-btn:hover {
        background: #1a8cd8;
    }
    
    .important-message {
        background: #1a1a1a;
        border-left: 4px solid #f59e0b;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 24px;
    }
    
    .important-message h4 {
        margin: 0 0 16px 0;
        color: #f59e0b;
        font-size: 16px;
        font-weight: 600;
    }
    
    .important-message ul {
        margin: 0;
        padding-left: 20px;
        color: #fff;
    }
    
    .important-message li {
        margin-bottom: 8px;
        line-height: 1.5;
    }
    
    .important-message strong {
        color: #1da1f2;
    }
    
    .modal-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        padding: 24px;
        background: #0a0a0a;
        border-radius: 0 0 20px 20px;
    }
    
    .modal-actions .secondary-btn {
        background: #1a1a1a;
        color: #8b98a5;
        border: 1px solid #333;
        padding: 12px 24px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
        min-width: 120px;
    }
    
    .modal-actions .secondary-btn:hover {
        background: #333;
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    /* Responsive para autenticación */
    @media (max-width: 768px) {
        .auth-screen {
            padding: 10px;
            min-height: 60vh;
        }
        
        .auth-form {
            padding: 24px;
        }
        
        .access-code-modal .modal-content {
            padding: 24px;
        }
        
        .code-container {
            flex-direction: column;
        }
        
        .generated-code {
            font-size: 16px;
        }
    }
    
    /* Estilos para Landing Page */
    .landing-page {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
        text-align: center;
    }
    
    .landing-content {
        background: #111;
        border-radius: 20px;
        padding: 40px;
        border: 1px solid #333;
    }
    
    .landing-header {
        margin-bottom: 40px;
    }
    
    .landing-header h1 {
        font-size: 48px;
        margin: 0 0 16px 0;
        background: linear-gradient(135deg, #1da1f2, #f91880);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 800;
    }
    
    .tagline {
        font-size: 18px;
        color: #8b98a5;
        margin: 0;
        font-style: italic;
    }
    
    .landing-description {
        text-align: left;
        margin-bottom: 40px;
    }
    
    .landing-description h2 {
        color: #fff;
        font-size: 24px;
        margin-bottom: 16px;
        text-align: center;
    }
    
    .landing-description > p {
        color: #fff;
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 32px;
        text-align: center;
    }
    
    .features {
        display: grid;
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 32px;
    }
    
    .feature {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        background: #0a0a0a;
        border-radius: 12px;
        border: 1px solid #333;
    }
    
    .feature-icon {
        font-size: 32px;
        flex-shrink: 0;
    }
    
    .feature-text h3 {
        color: #1da1f2;
        font-size: 18px;
        margin: 0 0 8px 0;
    }
    
    .feature-text p {
        color: #8b98a5;
        font-size: 14px;
        margin: 0;
        line-height: 1.5;
    }
    
    .important-notice {
        background: #1a1a1a;
        border-left: 4px solid #f59e0b;
        border-radius: 8px;
        padding: 20px;
        text-align: left;
    }
    
    .important-notice h3 {
        color: #f59e0b;
        font-size: 16px;
        margin: 0 0 12px 0;
    }
    
    .important-notice p {
        color: #fff;
        font-size: 14px;
        margin: 0;
        line-height: 1.5;
    }
    
    .landing-actions {
        text-align: center;
    }
    
    .primary-btn {
        background: linear-gradient(135deg, #1da1f2, #f91880);
        color: #fff;
        border: none;
        padding: 16px 32px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
        margin-bottom: 16px;
    }
    
    .primary-btn:hover {
        transform: translateY(-2px);
    }
    
    .legal-note {
        color: #8b98a5;
        font-size: 12px;
        margin: 0;
    }
    
    /* Estilos para Términos y Condiciones */
    .terms-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .terms-content {
        background: #111;
        border-radius: 16px;
        padding: 32px;
        border: 1px solid #333;
    }
    
    .terms-header {
        text-align: center;
        margin-bottom: 32px;
        position: relative;
    }
    
    .back-btn {
        position: absolute;
        left: 0;
        top: 0;
        background: none;
        border: 1px solid #333;
        color: #8b98a5;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    }
    
    .back-btn:hover {
        background: #333;
        color: #fff;
    }
    
    .terms-header h2 {
        color: #fff;
        font-size: 28px;
        margin: 0 0 8px 0;
    }
    
    .terms-subtitle {
        color: #8b98a5;
        font-size: 14px;
        margin: 0;
    }
    
    .terms-text {
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 16px;
        margin-bottom: 32px;
    }
    
    .terms-section {
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid #333;
    }
    
    .terms-section:last-child {
        border-bottom: none;
    }
    
    .terms-section.highlight {
        background: #1a1a1a;
        border-radius: 8px;
        padding: 20px;
        border-left: 4px solid #1da1f2;
    }
    
    .terms-section h3 {
        color: #1da1f2;
        font-size: 18px;
        margin: 0 0 12px 0;
    }
    
    .terms-section p {
        color: #fff;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 12px 0;
    }
    
    .terms-section ul {
        color: #8b98a5;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        padding-left: 20px;
    }
    
    .terms-section li {
        margin-bottom: 8px;
    }
    
    .terms-acceptance {
        border-top: 2px solid #333;
        padding-top: 24px;
    }
    
    .checkbox-container {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 24px;
        cursor: pointer;
        line-height: 1.5;
    }
    
    .checkbox-container input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: #1da1f2;
        flex-shrink: 0;
        margin: 0;
    }
    
    .checkbox-text {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
    }
    
    .terms-actions {
        display: flex;
        gap: 16px;
        justify-content: center;
    }
    
    .terms-actions .primary-btn:disabled {
        background: #333;
        color: #666;
        cursor: not-allowed;
        transform: none;
    }
    
    /* Responsive para landing y términos */
    @media (max-width: 768px) {
        .landing-page {
            padding: 20px 10px;
        }
        
        .landing-content {
            padding: 24px;
        }
        
        .landing-header h1 {
            font-size: 36px;
        }
        
        .features {
            gap: 16px;
        }
        
        .feature {
            padding: 16px;
        }
        
        .terms-page {
            padding: 10px;
        }
        
        .terms-content {
            padding: 20px;
        }
        
        .terms-header {
            margin-bottom: 24px;
        }
        
        .back-btn {
            position: static;
            margin-bottom: 16px;
        }
        
        .terms-actions {
            flex-direction: column;
        }
    }
    
    /* Estilos para vista previa de imágenes */
    .image-preview-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
        padding: 12px;
        background: #0a0a0a;
        border-radius: 8px;
        border: 1px solid #333;
        min-height: 60px;
        align-items: center;
    }
    
    .preview-item {
        position: relative;
        background: #111;
        border-radius: 6px;
        padding: 4px;
        border: 1px solid #333;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        width: 70px;
    }
    
    .preview-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
        border: 1px solid #333;
    }
    
    .remove-image-btn {
        position: absolute;
        top: 0px;
        right: 0px;
        background: rgba(255, 0, 0, 0.8);
        color: #fff;
        border: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
    }
    
    .remove-image-btn:hover {
        background: rgba(255, 0, 0, 1);
        transform: scale(1.1);
    }
    
    .image-name {
        color: #8b98a5;
        font-size: 8px;
        text-align: center;
        word-break: break-word;
        line-height: 1.1;
        max-width: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .add-more-btn {
        width: 70px;
        height: 70px;
        background: #111;
        border: 2px dashed #1da1f2;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.2s;
        color: #1da1f2;
    }
    
    .add-more-btn:hover {
        background: rgba(29, 161, 242, 0.1);
        border-color: #1a8cd8;
        transform: scale(1.05);
    }
    
    .add-more-icon {
        font-size: 24px;
        font-weight: bold;
        line-height: 1;
    }
    
    .add-more-text {
        font-size: 8px;
        text-align: center;
        line-height: 1.1;
    }
    
    /* Estilos para múltiples imágenes en posts */
    .post-images-container {
        margin-top: 12px;
        position: relative;
    }
    
    .post-images-container.single-image .post-image-item {
        width: 100%;
    }
    
    .post-images-container:not(.single-image) {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 8px;
        max-height: 400px;
        overflow: hidden;
    }
    
    .post-image-item {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: #111;
    }
    
    .post-image-item.multiple-images .post-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }
    
    .post-image-item.single-image .post-image {
        width: 100%;
        max-height: 500px;
        object-fit: cover;
    }
    
    .image-count {
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    
    /* Estilos para múltiples imágenes en modal */
    .modal-post-images-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
        margin-top: 12px;
    }
    
    .modal-post-image-item {
        border-radius: 8px;
        overflow: hidden;
    }
    
    .modal-post-image {
        width: 100%;
        height: 150px;
        object-fit: cover;
        cursor: pointer;
        transition: transform 0.2s;
    }
    
    .modal-post-image:hover {
        transform: scale(1.05);
    }
    
    /* Responsive para imágenes */
    @media (max-width: 768px) {
        .image-preview-container {
            gap: 6px;
            padding: 8px;
        }
        
        .preview-item {
            width: 60px;
        }
        
        .preview-image {
            width: 40px;
            height: 40px;
        }
        
        .image-name {
            font-size: 7px;
            max-width: 50px;
        }
        
        .remove-image-btn {
            width: 16px;
            height: 16px;
            font-size: 10px;
        }
        
        .post-images-container:not(.single-image) {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
        
        .post-image-item.multiple-images .post-image {
            height: 150px;
        }
        
        .modal-post-images-container {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        }
        
        .modal-post-image {
            height: 120px;
        }
    }
    
    /* Estilos para botones de eliminar */
    .post-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0 0 0;
        border-top: 1px solid #333;
        margin-top: 12px;
    }
    
    .post-actions-left {
        display: flex;
        align-items: center;
    }
    
    .post-actions-right {
        display: flex;
        align-items: center;
    }
    

    
    /* Estilos para modal de confirmación de eliminación */
    .delete-confirmation-modal, .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }
    
    .delete-confirmation-modal.show, .payment-modal.show {
        opacity: 1;
        visibility: visible;
    }
    
    .delete-confirmation-modal.hide, .payment-modal.hide {
        opacity: 0;
        visibility: hidden;
    }
    
    .delete-confirmation-modal .modal-overlay, .payment-modal .modal-overlay {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.9));
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }
    
    .delete-modal-content {
        background: #000;
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 100%;
        border: 2px solid #dc2626;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .delete-confirmation-modal.show .delete-modal-content {
        transform: scale(1);
    }
    
    .delete-modal-content .modal-header h3 {
        color: #dc2626;
        margin: 0 0 16px 0;
    }
    
    .delete-modal-content .modal-body p {
        color: #fff;
        line-height: 1.5;
        margin: 0 0 20px 0;
    }
    
    .danger-btn {
        background: #dc2626;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    
    .danger-btn:hover {
        background: #b91c1c;
    }
    
    /* Estilos limpios con paleta de la app */
    .clean-payment-content {
        background: #111;
        border-radius: 16px;
        padding: 0;
        max-width: 420px;
        width: 100%;
        border: 1px solid #333;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        overflow: hidden;
    }
    
    .payment-modal.show .clean-payment-content {
        transform: scale(1);
    }
    
    .clean-header {
        padding: 20px 24px 0 24px;
        display: flex;
        justify-content: flex-end;
    }
    
    .clean-header .modal-close-btn {
        background: none;
        border: none;
        color: #8b98a5;
        font-size: 16px;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .clean-header .modal-close-btn:hover {
        background: #333;
        color: #fff;
    }
    
    .clean-content {
        padding: 20px 24px;
    }
    
    .service-selection {
        margin-bottom: 24px;
    }
    
    .service-option {
        border: 2px solid #1da1f2;
        border-radius: 12px;
        padding: 16px;
        background: #0a0a0a;
        transition: all 0.2s;
    }
    
    .service-option.selected {
        border-color: #1da1f2;
        background: rgba(29, 161, 242, 0.05);
    }
    
    .service-radio {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
    
    .service-radio input[type="radio"] {
        width: 18px;
        height: 18px;
        accent-color: #1da1f2;
    }
    
    .service-name {
        color: #fff;
        font-weight: 500;
        font-size: 16px;
        margin-left: 12px;
        flex: 1;
    }
    
    .service-pricing {
        display: flex;
        align-items: center;
    }
    
    .service-price {
        color: #1da1f2;
        font-size: 18px;
        font-weight: 700;
    }
    
    .total-section {
        border-top: 1px solid #333;
        border-bottom: 1px solid #333;
        padding: 16px 0;
        margin-bottom: 20px;
    }
    
    .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .total-label {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
    }
    
    .total-amount {
        color: #1da1f2;
        font-size: 18px;
        font-weight: 700;
    }
    
    .payment-warning-clean {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 20px;
    }
    
    .payment-warning-clean p {
        color: #f59e0b;
        font-size: 13px;
        margin: 0;
        text-align: center;
    }
    
    .clean-actions {
        display: flex;
        gap: 12px;
        padding: 20px 24px 24px 24px;
        background: #0a0a0a;
        border-top: 1px solid #333;
    }
    
    .clean-cancel-btn {
        background: #1a1a1a;
        color: #8b98a5;
        border: 1px solid #333;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        flex: 1;
    }
    
    .clean-cancel-btn:hover {
        background: #333;
        color: #fff;
    }
    
    .clean-pay-btn {
        background: #1da1f2;
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
        flex: 1;
    }
    
    .clean-pay-btn:hover {
        background: #1a8cd8;
        transform: translateY(-1px);
    }
    
    /* Estilos para pantalla de información de pago */
    .payment-info-content {
        background: linear-gradient(145deg, #000, #111);
        border-radius: 20px;
        padding: 0;
        max-width: 450px;
        width: 100%;
        border: 1px solid #333;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        overflow: hidden;
    }
    
    .payment-modal.show .payment-info-content {
        transform: scale(1);
    }
    
    .service-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: linear-gradient(145deg, #111, #1a1a1a);
        border-radius: 12px;
        border: 1px solid #333;
        margin-bottom: 24px;
    }
    
    .service-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .icon-bg {
        font-size: 32px;
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #333;
    }
    
    .service-details {
        flex: 1;
    }
    
    .service-details h4 {
        margin: 0 0 4px 0;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
    }
    
    .service-details p {
        margin: 0;
        color: #8b98a5;
        font-size: 14px;
    }
    
    .service-price {
        text-align: right;
    }
    
    .price-amount {
        font-size: 24px;
        font-weight: 700;
        color: #10b981;
        display: block;
    }
    
    .price-currency {
        font-size: 12px;
        color: #8b98a5;
        font-weight: 500;
    }
    
    .service-benefits {
        margin-bottom: 24px;
    }
    
    .service-benefits h4 {
        color: #fff;
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
    }
    
    .benefits-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
    }
    
    .benefit-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #111;
        border-radius: 8px;
        border: 1px solid #333;
    }
    
    .benefit-icon {
        font-size: 16px;
    }
    
    .benefit-item span:last-child {
        color: #8b98a5;
        font-size: 13px;
    }
    
    .payment-warning-simple {
        background: #1a1a1a;
        border-radius: 10px;
        padding: 16px;
        border-left: 4px solid #f59e0b;
    }
    
    .warning-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }
    
    .warning-icon {
        font-size: 18px;
        flex-shrink: 0;
    }
    
    .warning-content p {
        margin: 0;
        color: #fff;
        font-size: 14px;
        line-height: 1.4;
    }
    
    .proceed-payment-btn {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #000;
        border: none;
        padding: 14px 24px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 700;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        min-width: 200px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    
    .proceed-payment-btn:hover {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
    }
    
    /* Estilos para formulario de pago separado */
    .payment-form-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }
    
    .payment-form-modal.show {
        opacity: 1;
        visibility: visible;
    }
    
    .payment-form-modal.hide {
        opacity: 0;
        visibility: hidden;
    }
    
    .payment-form-content {
        background: linear-gradient(145deg, #000, #111);
        border-radius: 20px;
        padding: 0;
        max-width: 500px;
        width: 100%;
        border: 1px solid #333;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .payment-form-modal.show .payment-form-content {
        transform: scale(1);
    }
    
    .payment-form-container {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
    }
    
    .payment-summary {
        background: #111;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 24px;
        border: 1px solid #333;
    }
    
    .summary-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #fff;
        font-size: 16px;
        font-weight: 500;
    }
    
    .summary-price {
        color: #10b981;
        font-size: 18px;
        font-weight: 700;
    }
    
    .payment-form-content .payment-form {
        padding: 0;
        background: transparent;
        max-height: none;
        overflow: visible;
    }
    
    /* Estilos para pasarela de pago original */
    .payment-modal-content {
        background: linear-gradient(145deg, #000, #111);
        border-radius: 20px;
        padding: 0;
        max-width: 520px;
        width: 100%;
        border: 1px solid #333;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        max-height: 90vh;
        overflow: hidden;
    }
    
    .payment-modal.show .payment-modal-content {
        transform: scale(1);
    }
    
    .payment-modal-content .modal-header {
        background: linear-gradient(135deg, #1da1f2, #1a8cd8);
        color: #fff;
        padding: 24px;
        border-radius: 20px 20px 0 0;
        border-bottom: none;
        position: relative;
        overflow: hidden;
    }
    
    .payment-modal-content .modal-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        opacity: 0.3;
    }
    
    .payment-modal-content .modal-header h3 {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        position: relative;
        z-index: 1;
    }
    
    .payment-modal-content .modal-close-btn {
        position: relative;
        z-index: 1;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        border-radius: 8px;
        padding: 8px;
    }
    
    .payment-modal-content .modal-close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .payment-info {
        padding: 24px;
        border-bottom: 1px solid #333;
    }
    
    .product-info {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #111;
        border-radius: 12px;
        border: 1px solid #333;
        margin-bottom: 20px;
    }
    
    .product-icon {
        font-size: 32px;
        background: #1a1a1a;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid #333;
    }
    
    .product-details {
        flex: 1;
    }
    
    .product-details h4 {
        margin: 0 0 4px 0;
        color: #fff;
        font-size: 16px;
    }
    
    .product-details p {
        margin: 0;
        color: #8b98a5;
        font-size: 13px;
    }
    
    .product-price {
        font-size: 20px;
        font-weight: 700;
        color: #1da1f2;
    }
    
    .payment-description {
        margin-bottom: 20px;
    }
    
    .payment-description h4 {
        color: #fff;
        margin: 0 0 12px 0;
        font-size: 16px;
    }
    
    .payment-description ul {
        margin: 0;
        padding-left: 20px;
        color: #8b98a5;
    }
    
    .payment-description li {
        margin-bottom: 6px;
        font-size: 14px;
    }
    
    .payment-warning {
        background: #1a1a1a;
        border-left: 4px solid #f59e0b;
        padding: 16px;
        border-radius: 8px;
    }
    
    .payment-warning h4 {
        color: #f59e0b;
        margin: 0 0 8px 0;
        font-size: 14px;
    }
    
    .payment-warning p {
        color: #fff;
        margin: 0;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .payment-form {
        padding: 28px;
        background: #0a0a0a;
        overflow-y: auto;
        max-height: 50vh;
    }
    
    .payment-form h4 {
        color: #fff;
        margin: 0 0 24px 0;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
    }
    
    .form-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 16px;
    }
    
    .payment-form .form-group {
        margin-bottom: 20px;
    }
    
    .payment-form label {
        display: block;
        color: #1da1f2;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .payment-form input {
        width: 100%;
        background: linear-gradient(145deg, #111, #1a1a1a);
        border: 2px solid #333;
        border-radius: 10px;
        color: #fff;
        padding: 14px 16px;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.3s ease;
        box-sizing: border-box;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .payment-form input:focus {
        outline: none;
        border-color: #1da1f2;
        background: linear-gradient(145deg, #1a1a1a, #222);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(29, 161, 242, 0.1);
        transform: translateY(-1px);
    }
    
    .payment-form input::placeholder {
        color: #666;
    }
    
    .payment-total {
        background: linear-gradient(145deg, #111, #1a1a1a);
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
        border: 1px solid #444;
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        color: #8b98a5;
        font-size: 14px;
    }
    
    .total-line.total {
        border-top: 2px solid #1da1f2;
        padding-top: 12px;
        margin-top: 16px;
        margin-bottom: 0;
        color: #fff;
        font-size: 18px;
        font-weight: 700;
    }
    
    .total-line.total span:last-child {
        color: #10b981;
        font-size: 20px;
    }
    
    .payment-btn {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        border: none;
        padding: 16px 24px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s ease;
        width: 100%;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
        position: relative;
        overflow: hidden;
    }
    
    .payment-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
    }
    
    .payment-btn:hover::before {
        left: 100%;
    }
    
    .payment-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }
    
    .payment-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 4px 20px rgba(16, 185, 129, 0.1);
    }
    
    .success-message {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: #fff;
        padding: 16px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 6000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    }
    
    .success-message.show {
        transform: translateX(0);
    }
    
    /* Responsive para modales de pago */
    @media (max-width: 768px) {
        .payment-modal-content {
            max-width: 95%;
            margin: 10px;
        }
        
        .payment-info, .payment-form {
            padding: 16px;
        }
        
        .product-info {
            flex-direction: column;
            text-align: center;
            gap: 12px;
        }
        
        .form-row {
            grid-template-columns: 1fr;
        }
        
        .delete-modal-content {
            max-width: 350px;
        }
    }
`;

// Agregar estilos del modal al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);

// Función para resetear completamente la aplicación (útil para desarrollo/testing)
function resetApplication() {
    localStorage.clear();
    currentUser = null;
    showLandingPage();
}

// Para testing: agregar función global para resetear
window.resetApp = resetApplication;


// ==================== REPORTAR PUBLICACIONES ====================

// Abrir/cerrar el menú de 3 puntitos de una publicación
function togglePostMenu(event, postId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`post-menu-${postId}`);
    if (!dropdown) return;
    // Cerrar todos los demás menús abiertos
    document.querySelectorAll('.post-menu-dropdown').forEach(d => {
        if (d !== dropdown) d.classList.add('hidden');
    });
    dropdown.classList.toggle('hidden');
}

// Cerrar los menús al hacer clic en cualquier otro lado
document.addEventListener('click', () => {
    document.querySelectorAll('.post-menu-dropdown').forEach(d => d.classList.add('hidden'));
});

// Reportar una publicación
async function reportPost(postId) {
    // Cerrar el menú
    const dropdown = document.getElementById(`post-menu-${postId}`);
    if (dropdown) dropdown.classList.add('hidden');

    if (!currentUser) {
        showError('Debes iniciar sesión para reportar');
        return;
    }
    if (!confirm('¿Reportar esta publicación a los administradores?')) return;
    try {
        const response = await fetch(`/api/posts/${postId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });
        let data = {};
        try { data = await response.json(); } catch (e) {}
        if (!response.ok) {
            throw new Error(data.error || 'Error al reportar');
        }
        showToast('🚩 ' + (data.message || 'Publicación reportada'), 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ==================== FUNCIONES DE ADMINISTRADOR (SUPERADMIN) ====================

// Manejo genérico de respuesta de acción admin
async function handleAdminResponse(response) {
    let data = {};
    try { data = await response.json(); } catch (e) {}
    if (!response.ok) {
        throw new Error(data.error || 'Error en la acción de administrador');
    }
    return data;
}

// Borrar cualquier publicación
async function adminDeletePost(postId) {
    if (!isSuperUser()) return;
    if (!confirm('¿Seguro que quieres BORRAR esta publicación? Esta acción no se puede deshacer.')) return;
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: adminHeaders()
        });
        await handleAdminResponse(response);
        showToast('🗑️ Publicación eliminada', 'success');
        posts = posts.filter(p => p._id !== postId);
        await loadPosts();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Editar una publicación (abre un modal con los campos actuales)
function adminEditPost(postId) {
    if (!isSuperUser()) return;
    const post = posts.find(p => p._id === postId);
    if (!post) { showToast('Publicación no encontrada', 'error'); return; }

    let modal = document.getElementById('adminEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminEditModal';
        modal.className = 'admin-edit-modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="admin-edit-overlay" onclick="closeAdminEdit()"></div>
        <div class="admin-edit-content">
            <div class="admin-edit-header">
                <h3>✏️ Editar publicación</h3>
                <button class="admin-edit-close" onclick="closeAdminEdit()">✖️</button>
            </div>
            <label class="admin-edit-label">Título</label>
            <input id="adminEditTitle" class="admin-edit-input" maxlength="200" value="">
            <label class="admin-edit-label">Descripción</label>
            <textarea id="adminEditDesc" class="admin-edit-textarea" maxlength="2000"></textarea>
            <div class="admin-edit-actions">
                <button class="admin-edit-cancel" onclick="closeAdminEdit()">Cancelar</button>
                <button class="admin-edit-save" onclick="submitAdminEdit('${postId}')">Guardar cambios</button>
            </div>
        </div>
    `;
    // Rellenar valores de forma segura (sin romper el HTML)
    document.getElementById('adminEditTitle').value = post.title || '';
    document.getElementById('adminEditDesc').value = post.description || '';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAdminEdit() {
    const modal = document.getElementById('adminEditModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

async function submitAdminEdit(postId) {
    const title = document.getElementById('adminEditTitle').value.trim();
    const description = document.getElementById('adminEditDesc').value.trim();
    if (!title && !description) {
        showToast('Escribe un título o descripción', 'error');
        return;
    }
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'PUT',
            headers: adminHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ title, description })
        });
        await handleAdminResponse(response);
        showToast('✏️ Publicación modificada', 'success');
        closeAdminEdit();
        await loadPosts();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Fijar / desfijar publicación
async function togglePin(postId) {
    if (!isSuperUser()) return;
    try {
        const response = await fetch(`/api/posts/${postId}/pin`, {
            method: 'POST',
            headers: adminHeaders()
        });
        const data = await handleAdminResponse(response);
        showToast(data.pinned ? '📌 Publicación fijada' : 'Publicación desfijada', 'success');
        await loadPosts();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Borrar un comentario
async function adminDeleteComment(postId, commentId) {
    if (!isSuperUser()) return;
    if (!confirm('¿Borrar este comentario?')) return;
    try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: adminHeaders()
        });
        await handleAdminResponse(response);
        showToast('🗑️ Comentario eliminado', 'success');
        const el = document.querySelector(`.modal-comment[data-comment-id="${commentId}"]`);
        if (el) el.remove();
        const postIndex = posts.findIndex(p => p._id === postId);
        if (postIndex !== -1 && posts[postIndex].comments) {
            posts[postIndex].comments = posts[postIndex].comments.filter(c => c._id !== commentId);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Borrar una respuesta
async function adminDeleteReply(postId, commentId, replyId) {
    if (!isSuperUser()) return;
    if (!confirm('¿Borrar esta respuesta?')) return;
    try {
        const response = await fetch(`/api/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
            method: 'DELETE',
            headers: adminHeaders()
        });
        await handleAdminResponse(response);
        showToast('🗑️ Respuesta eliminada', 'success');
        const el = document.querySelector(`.modal-reply[data-reply-id="${replyId}"]`);
        if (el) el.remove();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Banear / desbanear usuario
async function banUser(userId, username) {
    if (!isSuperUser()) return;
    if (!confirm(`¿Cambiar el estado de baneo de @${username}?`)) return;
    try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: adminHeaders()
        });
        const data = await handleAdminResponse(response);
        showToast(data.banned ? `🚫 @${username} baneado` : `✅ @${username} desbaneado`, 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Otorgar admin temporal (5 min)
async function grantTempAdmin(userId, username) {
    if (!isSuperUser()) return;
    if (!confirm(`¿Otorgar poderes de SUPERADMIN a @${username} por 5 minutos?`)) return;
    try {
        const response = await fetch(`/api/admin/users/${userId}/grant-temp`, {
            method: 'POST',
            headers: adminHeaders()
        });
        await handleAdminResponse(response);
        showToast(`👑 @${username} es admin temporal por 5 min`, 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Congelar / descongelar la página
async function toggleFreeze() {
    if (!isSuperUser()) return;
    try {
        const response = await fetch('/api/admin/freeze', {
            method: 'POST',
            headers: adminHeaders()
        });
        const data = await handleAdminResponse(response);
        showToast(data.frozen ? '❄️ Página congelada' : '🔥 Página descongelada', 'success');
        updateFreezeIndicator();   // refresca el indicador "En vivo/Congelado"
        loadAdminPanel();          // refresca el botón del panel
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Eliminar TODAS las publicaciones
async function deleteAllPosts() {
    if (!isSuperUser()) return;
    if (!confirm('⚠️ ¿Eliminar TODAS las publicaciones? Esto NO se puede deshacer.')) return;
    if (!confirm('Última confirmación: se borrará TODO el feed. ¿Seguro?')) return;
    try {
        const response = await fetch('/api/admin/posts/all', {
            method: 'DELETE',
            headers: adminHeaders()
        });
        const data = await handleAdminResponse(response);
        showToast(`🗑️ ${data.deleted || 0} publicaciones eliminadas`, 'success');
        posts = [];
        await loadPosts();
        loadAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Actualiza el indicador del feed: "En vivo" (verde) o "Congelado" (azul hielo)
async function updateFreezeIndicator() {
    const indicator = document.getElementById('liveIndicator');
    if (!indicator) return;
    try {
        const response = await fetch('/api/status');
        if (!response.ok) return;
        const data = await response.json();
        if (data.frozen) {
            indicator.textContent = 'Congelado';
            indicator.classList.add('frozen');
        } else {
            indicator.textContent = 'En vivo';
            indicator.classList.remove('frozen');
        }
    } catch (e) { /* silencioso */ }
}

// Descartar los reportes de una publicación (marcarla como revisada)
async function dismissReports(postId) {
    if (!isSuperUser()) return;
    if (!confirm('¿Descartar los reportes de esta publicación? (la quita de la bandeja sin borrarla)')) return;
    try {
        const response = await fetch(`/api/posts/${postId}/dismiss-reports`, {
            method: 'POST',
            headers: adminHeaders()
        });
        await handleAdminResponse(response);
        showToast('✅ Reportes descartados', 'success');
        loadAdminPanel();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ---- Panel de administrador ----

function openAdminPanel() {
    if (!isSuperUser()) return;
    let modal = document.getElementById('adminPanelModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminPanelModal';
        modal.className = 'admin-panel-modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="admin-panel-overlay" onclick="closeAdminPanel()"></div>
        <div class="admin-panel-content">
            <div class="admin-panel-header">
                <h2>👑 Panel de SUPERADMIN</h2>
                <button class="admin-panel-close" onclick="closeAdminPanel()">✖️</button>
            </div>
            <div class="admin-panel-body" id="adminPanelBody">
                <p class="admin-loading">Cargando...</p>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadAdminPanel();
}

function closeAdminPanel() {
    const modal = document.getElementById('adminPanelModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

async function loadAdminPanel() {
    const body = document.getElementById('adminPanelBody');
    if (!body) return;
    try {
        const response = await fetch('/api/admin/stats', { headers: adminHeaders() });
        const data = await handleAdminResponse(response);
        const s = data.stats;

        const statsHTML = `
            <div class="admin-stats-grid">
                <div class="admin-stat-card"><span class="admin-stat-num">${s.totalPosts}</span><span class="admin-stat-label">Publicaciones</span></div>
                <div class="admin-stat-card"><span class="admin-stat-num">${s.totalUsers}</span><span class="admin-stat-label">Usuarios</span></div>
                <div class="admin-stat-card"><span class="admin-stat-num">${s.totalComments}</span><span class="admin-stat-label">Comentarios</span></div>
                <div class="admin-stat-card"><span class="admin-stat-num">${s.totalLikes}</span><span class="admin-stat-label">Likes</span></div>
                <div class="admin-stat-card ${s.totalReported > 0 ? 'alert' : ''}"><span class="admin-stat-num">${s.totalReported}</span><span class="admin-stat-label">Reportadas</span></div>
            </div>
        `;

        const reported = data.reportedPosts || [];
        const postsHTML = reported.length ? reported.map(p => `
            <div class="admin-tray-item reported">
                <div class="admin-report-badge" title="${p.reportCount} reporte(s)">🚩 ${p.reportCount}</div>
                <div class="admin-tray-info">
                    <span class="admin-tray-title">${p.pinned ? '📌 ' : ''}${escapeHtml(p.title)}</span>
                    <span class="admin-tray-meta">${p.authorRole === 'superadmin' ? '👑 ' : ''}@${escapeHtml(p.author)} · ❤️ ${p.likes} · 💬 ${p.comments} · 🖼️ ${p.images}</span>
                </div>
                <div class="admin-tray-actions">
                    <button class="admin-mini-btn" onclick="dismissReports('${p._id}')" title="Descartar reportes (marcar como revisada)">✅</button>
                    <button class="admin-mini-btn ${p.pinned ? 'active' : ''}" onclick="togglePin('${p._id}')" title="Fijar/Desfijar">📌</button>
                    <button class="admin-mini-btn danger" onclick="adminDeletePost('${p._id}')" title="Borrar">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="admin-empty">✅ No hay publicaciones reportadas</p>';

        const usersHTML = data.users.length ? data.users.map(u => `
            <div class="admin-user-item ${u.banned ? 'banned' : ''}">
                <div class="admin-user-info">
                    <span class="admin-user-name ${u.role === 'superadmin' ? 'superadmin-name' : ''}">${u.role === 'superadmin' ? '👑 ' : ''}@${escapeHtml(u.username)}</span>
                    <span class="admin-user-tags">
                        ${u.role === 'superadmin' ? '<span class="tag tag-super">SUPERADMIN</span>' : ''}
                        ${u.isTempAdmin ? '<span class="tag tag-temp">Admin temporal</span>' : ''}
                        ${u.banned ? '<span class="tag tag-ban">Baneado</span>' : ''}
                    </span>
                </div>
                <div class="admin-user-actions">
                    ${u.role !== 'superadmin' ? `
                        <button class="admin-mini-btn" onclick="grantTempAdmin('${u._id}', '${escapeHtml(u.username)}')" title="Admin temporal 5 min">👑</button>
                        <button class="admin-mini-btn ${u.banned ? 'active' : 'danger'}" onclick="banUser('${u._id}', '${escapeHtml(u.username)}')" title="Banear/Desbanear">🚫</button>
                    ` : '<span class="admin-you">Tú</span>'}
                </div>
            </div>
        `).join('') : '<p class="admin-empty">No hay usuarios</p>';

        const controlsHTML = `
            <div class="admin-section">
                <h3>⚙️ Controles de la página</h3>
                <div class="admin-controls">
                    <button class="admin-control-btn ${data.frozen ? 'frozen-on' : ''}" onclick="toggleFreeze()">
                        ${data.frozen ? '🔥 Descongelar página' : '❄️ Congelar página'}
                    </button>
                    <button class="admin-control-btn danger" onclick="deleteAllPosts()">
                        🗑️ Eliminar TODAS las publicaciones
                    </button>
                </div>
                ${data.frozen ? '<p class="admin-frozen-note">❄️ La página está CONGELADA: los usuarios no pueden publicar.</p>' : ''}
            </div>
        `;

        body.innerHTML = `
            ${statsHTML}
            ${controlsHTML}
            <div class="admin-section">
                <h3>🚩 Bandeja de publicaciones reportadas</h3>
                <div class="admin-tray">${postsHTML}</div>
            </div>
            <div class="admin-section">
                <h3>👥 Usuarios registrados</h3>
                <div class="admin-users">${usersHTML}</div>
            </div>
        `;
    } catch (error) {
        body.innerHTML = `<p class="admin-error">Error: ${error.message}</p>`;
    }
}

// Escapar HTML para evitar romper el markup con contenido de usuarios
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
