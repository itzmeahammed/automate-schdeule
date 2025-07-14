const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const storagePath = path.join(app.getPath('userData'), 'app-storage.json');

function readStorage() {
  try {
    return JSON.parse(fs.readFileSync(storagePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeStorage(data) {
  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf8');
}

ipcMain.handle('storage-get', (event, key) => {
  const data = readStorage();
  return data[key] || null;
});

ipcMain.handle('storage-set', (event, key, value) => {
  const data = readStorage();
  data[key] = value;
  writeStorage(data);
});

function createWindow() {
  console.log('Creating Electron window...');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Check if we're in development or production
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // Development: load from Vite dev server
    win.loadURL('http://localhost:5173');
  } else {
    // Production: load from built files
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
}); 