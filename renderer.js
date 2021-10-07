// Use ipcRenderer + remote that can connect to Electron
// methods only available on the Node side otherwise
const { ipcRenderer } = require('electron');
const remote = require('@electron/remote');

// Use dialog via remote
const { app } = remote;
const { dialog } = remote;

// Use the fs and paths modules from node
const fs = require('fs');
const path = require('path');

// Test that we can find the path to special folder
// (this is where you would store settings etc)
console.log('userData', app.getPath('userData'));

document.body.innerHTML = `
  <h1>Hello World!</h1>
  <p>We are using Node.js ${process.versions.node}.
  Chromium ${process.versions.chrome}
  and Electron ${process.versions.electron}.</p>

  <button class="open-dialog">Try opening a dialog</button>
  <div class="open-report"></div>
  <div class="menu-choice"></div>
  <br>
  <textarea class="text-to-remember" rows="10" cols="80" placeholder="Things to remember...">
`;

// Listen for clicks on the open-dialog button
document.body.addEventListener('click', e => {
  if (!e.target.closest('.open-dialog')) { return; }
  let filePaths = dialog.showOpenDialogSync({
    properties: ['openFile', 'openDirectory', 'multiSelections']
  });
  let report = '<p>You chose the following folders/files:</p>';
  for (let path of filePaths) {
    report += '<p>' + path + '</p>';
  }
  document.querySelector('.open-report').innerHTML = report;
});

// Listen to menuChoices from the main process
// Listen for main message
ipcRenderer.on('menuChoice', (ipcEvent, menuItemLabel) => {
  document.querySelector('.menu-choice').innerHTML = '<p>You chose the menu item ' + menuItemLabel + '.</p>';
  // Save the text from the textarea in JSON format
  let fileExtensionToUse = 'myext';
  if (menuItemLabel === 'Save textarea contents') {
    let filePath = dialog.showSaveDialogSync({
      properties: ['createDirectory']
    });
    if (filePath) {
      // add extension if missing
      if (
        filePath.slice(-fileExtensionToUse.length - 1) !==
        '.' + fileExtensionToUse
      ) {
        filePath += '.' + fileExtensionToUse;
      }
      // save text as json
      let text = document.querySelector('.text-to-remember').value;
      fs.writeFileSync(
        filePath,
        JSON.stringify({ textArea: text }, null, '  '),
        'utf-8'
      );
    }
  }
  // Load the text from the textarea in JSON format
  if (menuItemLabel === 'Load textarea contents') {
    let filePaths = dialog.showOpenDialogSync({
      properties: ['openFile'],
      options: { filters: { extensions: [fileExtensionToUse] } }
    });
    if (filePaths) {
      let json = fs.readFileSync(filePaths[0], 'utf-8');
      let data = JSON.parse(json);
      document.querySelector('.text-to-remember').value = data.textArea;
    }
  }
});