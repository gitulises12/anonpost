// ==================== VARIABLES GLOBALES ====================
let currentUser = null;
let posts = [];

// ==================== FUNCIONES DE INICIO ====================
document.addEventListener('DOMContentLoaded', function() {
    showLoginForm();
});

function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('userInterface').classList.add('hidden');
}

function showUserInterface() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('userInterface').classList.remove('hidden');
    document.querySelector('.post-list').classList.remove('hidden');
    document.getElementById('newPostBtn').classList.remove('hidden');
    document.getElementById('currentUser').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    
    // Mostrar información del usuario
    document.getElementById('currentUser').textContent = `@${currentUser.username}`;
    
    loadPosts();
}

function logout() {
    currentUser = null;
    posts = [];
    showLoginForm();
}

// ==================== FUNCIONES DE AUTENTICACIÓN ====================
async function login() {
    const accessCode = document.getElementById('accessCode').value.trim();
    
    if (!accessCode) {
        alert('Por favor ingresa tu código de acceso');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showUserInterface();
        } else {
            alert(data.error || 'Error en el login');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const accessCode = document.getElementById('regAccessCode').value.trim();
    
    if (!username || !accessCode) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    if (username.length < 3) {
        alert('El nombre de usuario debe tener al menos 3 caracteres');
        return;
    }
    
    if (accessCode.length !== 19) {
        alert('El código de acceso debe tener el formato XXXX-XXXX-XXXX-XXXX');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, accessCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Usuario registrado exitosamente');
            document.getElementById('regUsername').value = '';
            document.getElementById('regAccessCode').value = '';
            showLoginForm();
        } else {
            alert(data.error || 'Error en el registro');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// ==================== FUNCIONES DE PUBLICACIONES ====================
async function loadPosts() {
    try {
        const response = await fetch('/api/posts');
        posts = await response.json();
        displayPosts();
    } catch (error) {
        console.error('Error cargando publicaciones:', error);
    }
}

function displayPosts() {
    const container = document.querySelector('.posts-container');
    container.innerHTML = '';
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="no-posts">No hay publicaciones aún. ¡Sé el primero en publicar!</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-author">@${post.userId.username}</span>
            <span class="post-date">${new Date(post.createdAt).toLocaleString()}</span>
        </div>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-text">${post.content}</p>
            ${post.images && post.images.length > 0 ? `
                <div class="post-images">
                    ${post.images.map(img => `
                        <img src="/uploads/${img.filename}" alt="Imagen" class="post-image" onclick="openImageModal('${img.filename}')">
                    `).join('')}
                </div>
            ` : ''}
        </div>
        <div class="post-actions">
            <button onclick="toggleComments('${post._id}')" class="comment-btn">
                💬 Comentarios (${post.comments.length})
            </button>
            <button onclick="deletePost('${post._id}')" class="delete-btn" style="display: ${post.userId._id === currentUser._id ? 'inline-block' : 'none'}">
                🗑️ Eliminar
            </button>
        </div>
        <div class="comments-section" id="comments-${post._id}" style="display: none;">
            <div class="comments-list" id="comments-list-${post._id}">
                ${post.comments.map(comment => createCommentElement(comment, post._id)).join('')}
            </div>
            <div class="add-comment">
                <input type="text" id="comment-${post._id}" placeholder="Escribe un comentario..." maxlength="500">
                <button onclick="addComment('${post._id}')" class="add-comment-btn">Comentar</button>
            </div>
        </div>
    `;
    return postDiv;
}

function createCommentElement(comment, postId) {
    return `
        <div class="comment" id="comment-${comment._id}">
            <div class="comment-header">
                <span class="comment-author">@${comment.userId.username}</span>
                <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="comment-content">
                <p>${comment.text}</p>
            </div>
            <div class="comment-actions">
                <button onclick="toggleReplies('${comment._id}')" class="reply-btn">
                    💬 Respuestas (${comment.replies.length})
                </button>
                <button onclick="deleteComment('${comment._id}', '${postId}')" class="delete-comment-btn" style="display: ${comment.userId._id === currentUser._id ? 'inline-block' : 'none'}">
                    🗑️
                </button>
            </div>
            <div class="replies-section" id="replies-${comment._id}" style="display: none;">
                <div class="replies-list" id="replies-list-${comment._id}">
                    ${comment.replies.map(reply => createReplyElement(reply, comment._id)).join('')}
                </div>
                <div class="add-reply">
                    <input type="text" id="reply-${comment._id}" placeholder="Escribe una respuesta..." maxlength="300">
                    <button onclick="addReply('${comment._id}')" class="add-reply-btn">Responder</button>
                </div>
            </div>
        </div>
    `;
}

function createReplyElement(reply, commentId) {
    return `
        <div class="reply" id="reply-${reply._id}">
            <div class="reply-header">
                <span class="reply-author">@${reply.userId.username}</span>
                <span class="reply-date">${new Date(reply.createdAt).toLocaleString()}</span>
            </div>
            <div class="reply-content">
                <p>${reply.text}</p>
            </div>
            <div class="reply-actions">
                <button onclick="deleteReply('${reply._id}', '${commentId}')" class="delete-reply-btn" style="display: ${reply.userId._id === currentUser._id ? 'inline-block' : 'none'}">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// ==================== FUNCIONES DE COMENTARIOS ====================
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

async function addComment(postId) {
    const commentInput = document.getElementById(`comment-${postId}`);
    const text = commentInput.value.trim();
    
    if (!text) {
        alert('Por favor escribe un comentario');
        return;
    }
    
    try {
        const response = await fetch('/api/posts/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                postId,
                text,
                userId: currentUser._id
            })
        });
        
        if (response.ok) {
            commentInput.value = '';
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al agregar comentario');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function deleteComment(commentId, postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (response.ok) {
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al eliminar comentario');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// ==================== FUNCIONES DE RESPUESTAS ====================
function toggleReplies(commentId) {
    const repliesSection = document.getElementById(`replies-${commentId}`);
    if (repliesSection.style.display === 'none') {
        repliesSection.style.display = 'block';
    } else {
        repliesSection.style.display = 'none';
    }
}

async function addReply(commentId) {
    const replyInput = document.getElementById(`reply-${commentId}`);
    const text = replyInput.value.trim();
    
    if (!text) {
        alert('Por favor escribe una respuesta');
        return;
    }
    
    try {
        const response = await fetch('/api/posts/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commentId,
                text,
                userId: currentUser._id
            })
        });
        
        if (response.ok) {
            replyInput.value = '';
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al agregar respuesta');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function deleteReply(replyId, commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/reply/${replyId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (response.ok) {
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al eliminar respuesta');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// ==================== FUNCIONES DE ELIMINACIÓN ====================
async function deletePost(postId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser._id })
        });
        
        if (response.ok) {
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al eliminar publicación');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// ==================== FUNCIONES DE MODAL DE IMAGEN ====================
function openImageModal(filename) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="close-image-modal" onclick="closeImageModal()">&times;</span>
            <img src="/uploads/${filename}" alt="Imagen ampliada" class="modal-image">
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.remove();
    }
}

// Cerrar modal al hacer clic fuera de la imagen
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('image-modal')) {
        closeImageModal();
    }
});

// ==================== FUNCIONES DE FORMULARIO DE PUBLICACIÓN ====================
function showPostForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Nueva Publicación</h3>
                <span class="close" onclick="closePostForm()">&times;</span>
            </div>
            <form id="postForm" onsubmit="submitPost(event)">
                <div class="form-group">
                    <label for="postTitle">Título:</label>
                    <input type="text" id="postTitle" required maxlength="100" placeholder="Título de tu publicación">
                </div>
                <div class="form-group">
                    <label for="postContent">Contenido:</label>
                    <textarea id="postContent" required maxlength="2000" placeholder="¿Qué quieres compartir?"></textarea>
                </div>
                <div class="form-group">
                    <label for="postImages">Imágenes (máximo 5):</label>
                    <input type="file" id="postImages" multiple accept="image/*" onchange="previewImages()">
                    <div id="imagePreview" class="image-preview"></div>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closePostForm()" class="cancel-btn">Cancelar</button>
                    <button type="submit" class="submit-btn">Publicar</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function closePostForm() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function previewImages() {
    const input = document.getElementById('postImages');
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    if (input.files.length > 5) {
        alert('Máximo 5 imágenes permitidas');
        input.value = '';
        return;
    }
    
    Array.from(input.files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                img.onclick = () => removeImage(index);
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    const input = document.getElementById('postImages');
    const dt = new DataTransfer();
    Array.from(input.files).forEach((file, i) => {
        if (i !== index) {
            dt.items.add(file);
        }
    });
    input.files = dt.files;
    previewImages();
}

async function submitPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const images = document.getElementById('postImages').files;
    
    if (!title || !content) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('userId', currentUser._id);
    
    Array.from(images).forEach((file, index) => {
        formData.append('images', file);
    });
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            closePostForm();
            loadPosts();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al crear publicación');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Menos de 1 minuto
        return 'Hace un momento';
    } else if (diff < 3600000) { // Menos de 1 hora
        const minutes = Math.floor(diff / 60000);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diff < 86400000) { // Menos de 1 día
        const hours = Math.floor(diff / 3600000);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString();
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePostForm();
        closeImageModal();
    }
});

// Permitir envío de formularios con Enter
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
            const form = activeElement.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
    }
});

