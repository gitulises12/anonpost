import React from 'react';
import PostCard from './PostCard';
import './PostList.css';
import { Post } from '../App';

interface PostListProps {
  posts: Post[];
  loading: boolean;
  onRefresh: () => void;
}

const PostList: React.FC<PostListProps> = ({ posts, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="post-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="post-list">
        <div className="empty-state">
          <h3>No hay publicaciones aún</h3>
          <p>Sé el primero en compartir algo</p>
          <button onClick={onRefresh} className="refresh-btn">
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-list">
      <div className="post-list-header">
        <h2>Publicaciones</h2>
        <button onClick={onRefresh} className="refresh-btn">
          Actualizar
        </button>
      </div>
      
      <div className="posts-container">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default PostList;
