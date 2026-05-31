import React from 'react';
import '../styles/sidebar.css';

type ViewType = 'calendar' | 'sticky' | 'todos';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onOpenSettings }) => {
  return (
    <nav className="sidebar">
      <div className="sidebar-top">
        <button
          className={`sidebar-btn ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => onViewChange('calendar')}
          title="日历"
        >
          📅
          <span className="tooltip">日历</span>
        </button>
        <button
          className={`sidebar-btn ${activeView === 'sticky' ? 'active' : ''}`}
          onClick={() => onViewChange('sticky')}
          title="便签"
        >
          📝
          <span className="tooltip">便签</span>
        </button>
        <button
          className={`sidebar-btn ${activeView === 'todos' ? 'active' : ''}`}
          onClick={() => onViewChange('todos')}
          title="待办事项"
        >
          ✅
          <span className="tooltip">待办事项</span>
        </button>
      </div>
      <div className="sidebar-bottom">
        <button
          className="sidebar-btn"
          onClick={onOpenSettings}
          title="设置"
        >
          ⚙
          <span className="tooltip">设置</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
