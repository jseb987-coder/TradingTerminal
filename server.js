const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React build folder
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Always return the main index.html for any route (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Attempt to open default browser when the executable starts (cross-platform)
  const url = `http://localhost:${PORT}`;
  try {
    const startCmd = process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    exec(startCmd, (err) => {
      if (err) console.warn('Could not open browser:', err.message);
    });
  } catch (err) {
    console.warn('Could not open browser:', err.message);
  }
});
