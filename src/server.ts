import express from 'express';
import http from 'http';

// web server
const app = express();

const appName = process.env.APP_NAME;

app.get('/', (req, res) => {
  res.json({
    app: 'Tebo Discord Bot',
    inviteToServer: `https://${appName}.herokuapp.com/invite`,
    version: process.env.npm_package_version,
    author: 'https://github.com/boedegoat',
  });
});

app.get('/invite', (req, res) => {
  res.redirect('https://discord.com/api/oauth2/authorize?client_id=863731372572934145&permissions=8&scope=bot%20applications.commands');
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  // ping server every 5 minutes to prevent app asleep on heroku
  setInterval(() => {
    http.get(`http://${appName}.herokuapp.com`);
  }, 5 * 60 * 1000); // 5 minutes
});
