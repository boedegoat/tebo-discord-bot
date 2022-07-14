import axios from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

// TODO: try implement Authorization Code Flow
// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
// to fix search result in empty []

const getAccessToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const { data } = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return data.access_token;
};

const spotifyRequest = axios.create({
  baseURL: 'https://api.spotify.com/v1',
  headers: {},
});

// Make interceptors (middleware)
spotifyRequest.interceptors.request.use(async (request) => {
  if (!request.headers!.Authorization) {
    request.headers!.Authorization = `Bearer ${await getAccessToken()}`;
  }
  console.log({ headers: request.headers });
  return request;
});

// If it returns a 401 error, the refreshAuth will be run,
// and the request retried with the new token
createAuthRefreshInterceptor(spotifyRequest, async (failedRequest: any) => {
  // eslint-disable-next-line no-param-reassign
  failedRequest.response.config.headers.Authorization = `Bearer ${await getAccessToken()}`;
  return Promise.resolve();
});

export default spotifyRequest;
