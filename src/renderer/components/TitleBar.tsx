import React, { useState, useEffect } from 'react';
import '../styles/titlebar.css';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized(!isMaximized);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="title-bar-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
            <rect x="13" y="5" width="8" height="6" rx="1.5" fill="currentColor" opacity="0.7"/>
            <rect x="3" y="13" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
            <rect x="17" y="13" width="4" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
          </svg>
        </div>
        <span className="title-bar-title">MooDay</span>
      </div>
      <div className="title-bar-center" />
      <div className="title-bar-right">
        <button className="title-bar-btn" onClick={handleMinimize} title="最小化">
          <svg width="10" height="10" viewBox="0 0 10 1">
            <rect width="10" height="1" rx="0.5" fill="currentColor"/>
          </svg>
        </button>
        <button className="title-bar-btn" onClick={handleMaximize} title={isMaximized ? '还原' : '最大化'}>
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1.5" y="2" width="7" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="0" y="0" width="7" height="6" rx="1" fill="var(--bg-secondary)" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          )}
        </button>
        <button className="title-bar-btn close" onClick={handleClose} title="关闭">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
