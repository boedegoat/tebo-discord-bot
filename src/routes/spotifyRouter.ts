import axios from 'axios';
import express from 'express';
import querystring from 'query-string';
import generateRandomString from '../lib/generateRandomString';
import { setSpotifyToken } from '../lib/spotifyToken';

const spotifyRouter = express.Router();
const port = process.env.PORT || 5000;
const appName = `${process.env.APP_NAME}.herokuapp.com`;
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = `${process.env.NODE_ENV === 'production' ? `https://${appName}` : `http://localhost:${port}`}/spotify/callback`;

spotifyRouter.get('/login', (req, res) => {
  const state = generateRandomString(16);

  res.redirect(`https://accounts.spotify.com/authorize?${
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
    })}`);
});

spotifyRouter.get('/callback', async (req, res) => {
  const { code = null, state = null } = req.query;

  if (state === null) {
    res.redirect(`/#${
      querystring.stringify({
        error: 'state_mismatch',
      })}`);
    return;
  }

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    querystring.stringify({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // TODO: this is just temporary, change this later
        // eslint-disable-next-line no-buffer-constructor
        Authorization: `Basic ${new Buffer(`${clientId}:${clientSecret}`).toString('base64')}`,
        json: true,
      },
    },
  );

  setSpotifyToken(data);
  res.send('success');
});

spotifyRouter.get('/refresh-token', async (req, res) => {
  if (!global.spotifyToken) {
    throw 'spotify token not exist';
  }
  const { refreshToken } = global.spotifyToken;

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // TODO: this is just temporary, change this later
        // eslint-disable-next-line no-buffer-constructor
        Authorization: `Basic ${new Buffer(`${clientId}:${clientSecret}`).toString('base64')}`,
        json: true,
      },
    },
  );

  setSpotifyToken({ ...global.spotifyToken, ...data });

  res.json(data);
});

export default spotifyRouter;
