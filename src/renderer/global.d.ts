export interface ElectronAPI {
  openExternalUrl: (url: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getSettings: () => Promise<{ shortcuts: { createSticky: string; togglePin: string; toggleVisibility: string; deleteSticky: string }; storagePath: string }>;
  saveSettings: (settings: { shortcuts: { createSticky: string; togglePin: string; toggleVisibility: string; deleteSticky: string }; storagePath: string }) => Promise<void>;
  selectFolder: () => Promise<string | null>;
  floatSticky: (stickyData: any, posX?: number, posY?: number) => Promise<void>;
  unfloatSticky: (stickyId: string) => Promise<void>;
  syncFloatingSticky: (stickyData: any) => Promise<void>;
  updateFloatingTitle: (data: { id: string; mood: string; pinned: boolean }) => Promise<void>;
  getMainWindowBounds: () => Promise<{ x: number; y: number; width: number; height: number; contentX: number; contentY: number; contentWidth: number; contentHeight: number } | null>;
  createFloatPreview: (stickyData: any, posX: number, posY: number) => Promise<void>;
  moveFloatPreview: (posX: number, posY: number, isOutside: boolean) => Promise<void>;
  destroyFloatPreview: () => Promise<void>;
  finalizeFloatPreview: () => Promise<void>;
  dockFloatToMain: (floatId: string) => Promise<void>;
  onTogglePin: (callback: () => void) => () => void;
  onToggleVisibility: (callback: () => void) => () => void;
  onDeleteSticky: (callback: () => void) => () => void;
  onCreateSticky: (callback: () => void) => () => void;
  onFloatStickyData: (callback: (data: any) => void) => () => void;
  onFloatPreviewMode: (callback: (isPreview: boolean) => void) => () => void;
  onFloatPreviewOutside: (callback: (isOutside: boolean) => void) => () => void;
  onFloatOverMain: (callback: (nearCenter: boolean) => void) => () => void;
  onFloatStickyClosed: (callback: (id: string) => void) => () => void;
  onSyncFloatingSticky: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
