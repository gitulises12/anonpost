import React from 'react';
import './Header.css';

interface HeaderProps {
  onNewPost: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewPost }) => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">AnonPosts</h1>
        <button className="new-post-btn" onClick={onNewPost}>
          Nueva Publicación
        </button>
      </div>
    </header>
  );
};

export default Header;
