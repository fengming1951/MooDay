import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, shell, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const floatingWindows: Map<string, BrowserWindow> = new Map();
const floatMoveTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
let dragPreviewWin: BrowserWindow | null = null;
let dragPreviewId: string | null = null;
let dragPreviewW: number = 300;
let dragPreviewH: number = 260;
let lastOutsideSignal: boolean | null = null;

interface ShortcutConfig {
  createSticky: string;
  togglePin: string;
  toggleVisibility: string;
  deleteSticky: string;
}

const defaultShortcuts: ShortcutConfig = {
  createSticky: 'CommandOrControl+N',
  togglePin: 'CommandOrControl+Shift+P',
  toggleVisibility: 'CommandOrControl+Shift+H',
  deleteSticky: 'CommandOrControl+Shift+D',
};

let currentShortcuts: ShortcutConfig = { ...defaultShortcuts };

function registerShortcuts() {
  globalShortcut.unregisterAll();
  try {
    globalShortcut.register(currentShortcuts.createSticky, () => {
      if (mainWindow && mainWindow.isVisible() && !mainWindow.isMinimized()) {
        mainWindow.webContents.send('create-sticky');
      } else {
        const cursor = screen.getCursorScreenPoint();
        createFloatStickyWindow({ id: genId(), content: '', images: [], mood: 'neutral', moodStartTime: null, isPinned: false, isVisible: true, size: { width: 320, height: 260 }, createdAt: Date.now(), updatedAt: Date.now() }, cursor.x, cursor.y);
      }
    });
    globalShortcut.register(currentShortcuts.toggleVisibility, () => {
      mainWindow?.webContents.send('toggle-sticky-visibility');
    });
    globalShortcut.register(currentShortcuts.togglePin, () => {
      mainWindow?.webContents.send('toggle-sticky-pin');
    });
    globalShortcut.register(currentShortcuts.deleteSticky, () => {
      mainWindow?.webContents.send('delete-sticky');
    });
  } catch (e) {
    console.error('Failed to register shortcuts:', e);
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  if (process.env.MOODAY_DEV_SERVER === 'true') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createFloatStickyWindow(stickyData: any, posX?: number, posY?: number) {
  const w = stickyData.size?.width || 320;
  const h = (stickyData.size?.height || 260) + 40;

  const winOpts: Electron.BrowserWindowConstructorOptions = {
    width: w,
    height: h,
    minWidth: 260,
    minHeight: 180,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: stickyData.isPinned || false,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  };

  if (posX !== undefined && posY !== undefined) {
    winOpts.x = Math.round(posX);
    winOpts.y = Math.round(posY);
  }

  const floatWin = new BrowserWindow(winOpts);

  floatWin.once('ready-to-show', () => {
    floatWin.show();
    floatWin.webContents.send('float-sticky-data', stickyData);
  });

  floatWin.on('closed', () => {
    floatingWindows.delete(stickyData.id);
    const t = floatMoveTimers.get(stickyData.id);
    if (t) { clearTimeout(t); floatMoveTimers.delete(stickyData.id); }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('float-sticky-closed', stickyData.id);
    }
  });

  const floatHash = `float/${encodeURIComponent(stickyData.id)}`;
  if (process.env.MOODAY_DEV_SERVER === 'true') {
    floatWin.loadURL(`http://localhost:3000#${floatHash}`);
  } else {
    floatWin.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: floatHash });
  }

  floatingWindows.set(stickyData.id, floatWin);

  floatWin.on('move', () => {
    if (!floatWin || floatWin.isDestroyed()) return;
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const fb = floatWin.getBounds();
    const mb = mainWindow.getBounds();
    const fcx = fb.x + fb.width / 2;
    const fcy = fb.y + fb.height / 2;
    const mcx = mb.x + mb.width / 2;
    const mcy = mb.y + mb.height / 2;
    const thresholdX = mb.width * 0.35;
    const thresholdY = mb.height * 0.35;
    const isNearCenter = Math.abs(fcx - mcx) < thresholdX && Math.abs(fcy - mcy) < thresholdY;
    floatWin.webContents.send('float-over-main', isNearCenter);

    if (isNearCenter) {
      const existing = floatMoveTimers.get(stickyData.id);
      if (existing) clearTimeout(existing);
      floatMoveTimers.set(stickyData.id, setTimeout(() => {
        if (floatWin && !floatWin.isDestroyed() && mainWindow && !mainWindow.isDestroyed()) {
          floatingWindows.delete(stickyData.id);
          floatMoveTimers.delete(stickyData.id);
          floatWin.removeAllListeners('move');
          floatWin.removeAllListeners('closed');
          floatWin.close();
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('float-sticky-closed', stickyData.id);
        }
      }, 280));
    } else {
      const existing = floatMoveTimers.get(stickyData.id);
      if (existing) { clearTimeout(existing); floatMoveTimers.delete(stickyData.id); }
    }
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 MooDay', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: '新建便签', click: () => mainWindow?.webContents.send('create-sticky') },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('MooDay');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  floatingWindows.forEach((win, id) => {
    if (win && !win.isDestroyed()) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('float-sticky-closed', id);
      }
      win.removeAllListeners('closed');
      win.close();
    }
  });
  floatingWindows.clear();
});

ipcMain.handle('open-external-url', async (_event, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) { mainWindow.unmaximize(); } else { mainWindow?.maximize(); }
});
ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win !== mainWindow) {
    win.close();
  } else {
    mainWindow?.hide();
  }
});
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized());

ipcMain.handle('float-sticky', (_event, stickyData: any, posX?: number, posY?: number) => {
  createFloatStickyWindow(stickyData, posX, posY);
});

ipcMain.handle('unfloat-sticky', (_event, stickyId: string) => {
  const floatWin = floatingWindows.get(stickyId);
  if (floatWin && !floatWin.isDestroyed()) {
    floatWin.close();
  }
  floatingWindows.delete(stickyId);
});

ipcMain.handle('sync-floating-sticky', (_event, stickyData: any) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync-floating-sticky', stickyData);
  }
});

ipcMain.handle('update-floating-title', (_event, { id, mood, pinned }: { id: string; mood: string; pinned: boolean }) => {
  const floatWin = floatingWindows.get(id);
  if (floatWin && !floatWin.isDestroyed()) {
    floatWin.setAlwaysOnTop(pinned);
  }
});

ipcMain.handle('dock-float-to-main', (_event, floatId: string) => {
  const floatWin = floatingWindows.get(floatId);
  if (!floatWin || floatWin.isDestroyed()) return;
  floatingWindows.delete(floatId);
  const t = floatMoveTimers.get(floatId);
  if (t) { clearTimeout(t); floatMoveTimers.delete(floatId); }
  floatWin.removeAllListeners('move');
  floatWin.removeAllListeners('closed');
  floatWin.close();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('float-sticky-closed', floatId);
  }
});

ipcMain.handle('get-main-window-bounds', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const b = mainWindow.getBounds();
    const c = mainWindow.getContentBounds();
    return { x: b.x, y: b.y, width: b.width, height: b.height, contentX: c.x, contentY: c.y, contentWidth: c.width, contentHeight: c.height };
  }
  return null;
});

ipcMain.handle('get-settings', () => {
  const settingsPath = path.join(app.getPath('userData'), 'mooday-settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (_) {}
  return {
    shortcuts: { ...defaultShortcuts },
    storagePath: app.getPath('userData'),
  };
});

ipcMain.handle('save-settings', (_event, settings: { shortcuts: ShortcutConfig; storagePath: string }) => {
  const settingsPath = path.join(app.getPath('userData'), 'mooday-settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (_) {}
  currentShortcuts = { ...settings.shortcuts };
  registerShortcuts();
});

ipcMain.handle('create-float-preview', (_event, stickyData: any, posX: number, posY: number) => {
  if (dragPreviewWin && !dragPreviewWin.isDestroyed()) {
    dragPreviewWin.removeAllListeners('closed');
    dragPreviewWin.close();
  }
  dragPreviewW = stickyData.size?.width || 300;
  dragPreviewH = (stickyData.size?.height || 260);

  dragPreviewWin = new BrowserWindow({
    width: dragPreviewW,
    height: dragPreviewH,
    x: Math.round(posX),
    y: Math.round(posY),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  dragPreviewId = stickyData.id;
  lastOutsideSignal = null;

  dragPreviewWin.once('ready-to-show', () => {
    dragPreviewWin?.show();
    dragPreviewWin?.webContents.send('float-sticky-data', stickyData);
    dragPreviewWin?.webContents.send('float-preview-mode', true);
  });

  const floatHash = `float/${encodeURIComponent(stickyData.id)}`;
  if (process.env.MOODAY_DEV_SERVER === 'true') {
    dragPreviewWin.loadURL(`http://localhost:3000#${floatHash}`);
  } else {
    dragPreviewWin.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: floatHash });
  }
});

ipcMain.handle('move-float-preview', (_event, posX: number, posY: number, isOutside: boolean) => {
  if (dragPreviewWin && !dragPreviewWin.isDestroyed()) {
    dragPreviewWin.setBounds({
      x: Math.round(posX),
      y: Math.round(posY),
      width: dragPreviewW,
      height: dragPreviewH,
    });
    if (isOutside !== lastOutsideSignal) {
      lastOutsideSignal = isOutside;
      dragPreviewWin.webContents.send('float-preview-outside', isOutside);
    }
  }
});

ipcMain.handle('destroy-float-preview', () => {
  if (dragPreviewWin && !dragPreviewWin.isDestroyed()) {
    dragPreviewWin.removeAllListeners('closed');
    dragPreviewWin.close();
  }
  dragPreviewWin = null;
  dragPreviewId = null;
  dragPreviewW = 300;
  dragPreviewH = 260;
  lastOutsideSignal = null;
});

ipcMain.handle('finalize-float-preview', () => {
  if (dragPreviewWin && !dragPreviewWin.isDestroyed()) {
    const id = dragPreviewId;
    const win = dragPreviewWin;
    dragPreviewWin = null;
    dragPreviewId = null;
    dragPreviewW = 300;
    dragPreviewH = 260;
    lastOutsideSignal = null;

    win.setAlwaysOnTop(false);
    win.setSkipTaskbar(false);
    win.setResizable(true);
    win.webContents.send('float-preview-mode', false);

    win.on('closed', () => {
      floatingWindows.delete(id || '');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('float-sticky-closed', id);
      }
    });

    if (id) floatingWindows.set(id, win);
  }
});

ipcMain.handle('select-folder', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});
