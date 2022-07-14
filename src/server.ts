import 'express-async-errors';
import express from 'express';
import http from 'http';
import spotifyRouter from './routes/spotifyRouter';
import { getAppName, getPort } from './lib/utils';

// web server
const app = express();
const port = getPort();
const appName = getAppName();

app.get('/', (req, res) => {
  res.json({
    app: 'Tebo Discord Bot',
    inviteToServer: `https://${appName}/invite`,
    version: process.env.npm_package_version,
    author: 'https://github.com/boedegoat',
  });
});

app.get('/invite', (req, res) => {
  res.redirect('https://discord.com/api/oauth2/authorize?client_id=863731372572934145&permissions=8&scope=bot%20applications.commands');
});

// SPOTIFY ROUTES
app.use('/spotify', spotifyRouter);

// ERROR HANDLER
// @ts-ignore
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.json({ err });
});

const runWebServer = () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);

    // ping server every 5 minutes to prevent app asleep on heroku
    setInterval(() => {
      http.get(`http://${appName}`);
    }, 5 * 60 * 1000); // 5 minutes
  });
};

export default runWebServer;
