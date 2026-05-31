import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  floatSticky: (stickyData: any, posX?: number, posY?: number) => ipcRenderer.invoke('float-sticky', stickyData, posX, posY),
  unfloatSticky: (stickyId: string) => ipcRenderer.invoke('unfloat-sticky', stickyId),
  syncFloatingSticky: (stickyData: any) => ipcRenderer.invoke('sync-floating-sticky', stickyData),
  updateFloatingTitle: (data: { id: string; mood: string; pinned: boolean }) => ipcRenderer.invoke('update-floating-title', data),
  getMainWindowBounds: () => ipcRenderer.invoke('get-main-window-bounds'),
  createFloatPreview: (stickyData: any, posX: number, posY: number) => ipcRenderer.invoke('create-float-preview', stickyData, posX, posY),
  moveFloatPreview: (posX: number, posY: number, isOutside: boolean) => ipcRenderer.invoke('move-float-preview', posX, posY, isOutside),
  destroyFloatPreview: () => ipcRenderer.invoke('destroy-float-preview'),
  finalizeFloatPreview: () => ipcRenderer.invoke('finalize-float-preview'),
  dockFloatToMain: (floatId: string) => ipcRenderer.invoke('dock-float-to-main', floatId),
  onTogglePin: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-sticky-pin', listener);
    return () => ipcRenderer.removeListener('toggle-sticky-pin', listener);
  },
  onToggleVisibility: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-sticky-visibility', listener);
    return () => ipcRenderer.removeListener('toggle-sticky-visibility', listener);
  },
  onDeleteSticky: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('delete-sticky', listener);
    return () => ipcRenderer.removeListener('delete-sticky', listener);
  },
  onCreateSticky: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('create-sticky', listener);
    return () => ipcRenderer.removeListener('create-sticky', listener);
  },
  onFloatStickyData: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('float-sticky-data', listener);
    return () => ipcRenderer.removeListener('float-sticky-data', listener);
  },
  onFloatPreviewMode: (callback: (isPreview: boolean) => void) => {
    const listener = (_event: any, isPreview: boolean) => callback(isPreview);
    ipcRenderer.on('float-preview-mode', listener);
    return () => ipcRenderer.removeListener('float-preview-mode', listener);
  },
  onFloatPreviewOutside: (callback: (isOutside: boolean) => void) => {
    const listener = (_event: any, isOutside: boolean) => callback(isOutside);
    ipcRenderer.on('float-preview-outside', listener);
    return () => ipcRenderer.removeListener('float-preview-outside', listener);
  },
  onFloatOverMain: (callback: (nearCenter: boolean) => void) => {
    const listener = (_event: any, nearCenter: boolean) => callback(nearCenter);
    ipcRenderer.on('float-over-main', listener);
    return () => ipcRenderer.removeListener('float-over-main', listener);
  },
  onFloatStickyClosed: (callback: (id: string) => void) => {
    const listener = (_event: any, id: string) => callback(id);
    ipcRenderer.on('float-sticky-closed', listener);
    return () => ipcRenderer.removeListener('float-sticky-closed', listener);
  },
  onSyncFloatingSticky: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('sync-floating-sticky', listener);
    return () => ipcRenderer.removeListener('sync-floating-sticky', listener);
  },
});
