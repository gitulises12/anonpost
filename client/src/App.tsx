import React, { useState, useEffect } from 'react';
import './App.css';
import PostForm from './components/PostForm';
import PostList from './components/PostList';
import Header from './components/Header';

export interface Post {
  _id: string;
  title: string;
  description: string;
  image?: string;
  createdAt: string;
  isNSFW?: boolean;
}

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error al cargar publicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    setShowForm(false);
  };

  return (
    <div className="App">
      <Header onNewPost={() => setShowForm(true)} />
      
      <main className="main-content">
        <div className="container">
          {showForm && (
            <PostForm 
              onPostCreated={handleNewPost}
              onCancel={() => setShowForm(false)}
            />
          )}
          
          <PostList 
            posts={posts} 
            loading={loading}
            onRefresh={fetchPosts}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
