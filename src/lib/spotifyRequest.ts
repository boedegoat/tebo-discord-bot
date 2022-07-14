import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { readSpotifyToken } from '../routes/spotifyRouter';

// TODO: try implement Authorization Code Flow
// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
// to fix search result in empty []

const spotifyRequest = axios.create({
  baseURL: 'https://api.spotify.com/v1',
});

// Make interceptors (middleware)
spotifyRequest.interceptors.request.use(async (request) => {
  const { accessToken, tokenType } = await readSpotifyToken();
  // @ts-ignore
  request.headers.Authorization = `${tokenType} ${accessToken}`;
  return request;
});

// If it returns a 401 error, the refreshAuth will be run,
// and the request retried with the new token
createAuthRefreshInterceptor(spotifyRequest, async (failedRequest: any) => {
  const appName = process.env.APP_NAME;
  const port = process.env.PORT || 5000;
  const baseURL = `${process.env.NODE_ENV === 'production' ? `https://${appName}` : `http://localhost:${port}`}`;

  const { data } = await axios.get(`${baseURL}/spotify/refresh-token`);
  const { access_token: accessToken, token_type: tokenType } = data;
  // eslint-disable-next-line no-param-reassign
  failedRequest.response.config.headers.Authorization = `${tokenType} ${accessToken}`;
  return Promise.resolve();
});

export default spotifyRequest;
