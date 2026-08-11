import React, { useState } from 'react';
import axios from 'axios';
import './PostForm.css';
import { Post } from '../App';

interface PostFormProps {
  onPostCreated: (post: Post) => void;
  onCancel: () => void;
}

const PostForm: React.FC<PostFormProps> = ({ onPostCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await axios.post('/api/posts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPostCreated(response.data);
      setFormData({ title: '', description: '', image: null });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-form-overlay">
      <div className="post-form">
        <div className="post-form-header">
          <h2>Nueva Publicación</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="title"
              placeholder="Título de tu publicación..."
              value={formData.title}
              onChange={handleInputChange}
              maxLength={200}
              required
            />
          </div>
          
          <div className="form-group">
            <textarea
              name="description"
              placeholder="¿Qué quieres compartir?"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={2000}
              rows={4}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="file-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <span className="file-text">
                {formData.image ? formData.image.name : 'Agregar imagen (opcional)'}
              </span>
            </label>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;
