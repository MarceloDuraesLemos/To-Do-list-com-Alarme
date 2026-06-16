const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Exportar agenda (escolher pasta/arquivo)
ipcMain.handle('save-tasks', async (event, tasks) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Exportar agenda',
    defaultPath: 'agenda.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
    return true;
  }
  return false;
});

// Importar agenda (escolher arquivo)
ipcMain.handle('load-tasks', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Importar agenda',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths[0]) {
    const data = fs.readFileSync(filePaths[0], 'utf-8');
    return JSON.parse(data);
  }
  return null;
});
