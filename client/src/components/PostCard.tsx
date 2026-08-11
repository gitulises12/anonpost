import React, { useState } from 'react';
import './PostCard.css';
import { Post } from '../App';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [imageError, setImageError] = useState(false);
  const [showNSFW, setShowNSFW] = useState(false);

  const formatDate = (dateString: string) => {
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
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = () => {
    if (post.isNSFW && !showNSFW) {
      setShowNSFW(true);
    }
  };

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-meta">
          <span className="post-author">Anónimo</span>
          <span className="post-date">{formatDate(post.createdAt)}</span>
        </div>
      </div>
      
      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-description">{post.description}</p>
        
        {post.image && !imageError && (
          <div className="post-image-container">
            {post.isNSFW && !showNSFW ? (
              <div className="nsfw-overlay" onClick={handleImageClick}>
                <div className="nsfw-content">
                  <span className="nsfw-icon">⚠️</span>
                  <p>Contenido NSFW</p>
                  <button className="nsfw-button">Hacer clic para ver</button>
                </div>
              </div>
            ) : (
              <img
                src={`/uploads/${post.image}`}
                alt="Imagen de la publicación"
                className="post-image"
                onError={handleImageError}
                onClick={handleImageClick}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
