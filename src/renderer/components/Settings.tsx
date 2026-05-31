import React, { useState, useEffect } from 'react';
import '../styles/settings.css';

interface ShortcutConfig {
  createSticky: string;
  togglePin: string;
  toggleVisibility: string;
  deleteSticky: string;
}

interface SettingsData {
  shortcuts: ShortcutConfig;
  storagePath: string;
}

interface SettingsProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  onClose: () => void;
}

const defaultShortcuts: ShortcutConfig = {
  createSticky: 'CommandOrControl+N',
  togglePin: 'CommandOrControl+Shift+P',
  toggleVisibility: 'CommandOrControl+Shift+H',
  deleteSticky: 'CommandOrControl+Shift+D',
};

const shortcutLabels: Record<keyof ShortcutConfig, string> = {
  createSticky: '新建便签',
  togglePin: '切换置顶',
  toggleVisibility: '切换显示/隐藏',
  deleteSticky: '删除便签',
};

const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange, onClose }) => {
  const [settings, setSettings] = useState<SettingsData>({
    shortcuts: { ...defaultShortcuts },
    storagePath: '',
  });
  const [editingKey, setEditingKey] = useState<keyof ShortcutConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSettings().then((s: SettingsData) => {
        setSettings(s);
      });
    }
  }, []);

  const handleShortcutChange = (key: keyof ShortcutConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: { ...prev.shortcuts, [key]: value },
    }));
  };

  const handleKeyCapture = (e: React.KeyboardEvent, key: keyof ShortcutConfig) => {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    const keyName = e.key.toUpperCase();
    if (!['CONTROL', 'SHIFT', 'ALT', 'META'].includes(keyName)) {
      parts.push(keyName);
    }
    if (parts.length >= 2) {
      handleShortcutChange(key, parts.join('+'));
      setEditingKey(null);
    }
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setSettings(prev => ({ ...prev, storagePath: folder }));
      }
    }
  };

  const handleSave = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span className="settings-title">⚙ 设置</span>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <div className="settings-section-title">外观</div>
            <div className="theme-toggle-row">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                ☀ 浅色
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                🌙 深色
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">快捷键设置</div>
            <p className="settings-section-hint">点击输入框后按下组合键来修改快捷键</p>
            <div className="shortcuts-list">
              {(Object.keys(shortcutLabels) as Array<keyof ShortcutConfig>).map(key => (
                <div key={key} className="shortcut-item">
                  <span className="shortcut-label">{shortcutLabels[key]}</span>
                  <input
                    className="shortcut-input"
                    value={editingKey === key ? '按下组合键...' : settings.shortcuts[key]}
                    readOnly
                    onFocus={() => setEditingKey(key)}
                    onBlur={() => setEditingKey(null)}
                    onKeyDown={(e) => {
                      if (editingKey === key) handleKeyCapture(e, key);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">数据存储路径</div>
            <div className="storage-path-row">
              <input
                className="storage-path-input"
                value={settings.storagePath}
                readOnly
                placeholder="默认存储路径"
              />
              <button className="browse-btn" onClick={handleSelectFolder}>
                浏览...
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? '✓ 已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
