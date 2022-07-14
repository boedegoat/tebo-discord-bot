type SpotifyToken = {
    accessToken: string
        refreshToken: string
        tokenType: string
};

declare global {
    // eslint-disable-next-line no-var, no-unused-vars, vars-on-top
    var spotifyToken: SpotifyToken | undefined;
}

// eslint-disable-next-line import/prefer-default-export
export const setSpotifyToken = (data: any) => {
  global.spotifyToken = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
  };
};

// export const getSpotifyToken = () => {
//   console.log('getSpotifyToken global.spotifyToken');
//   if (!global.spotifyToken.accessToken) throw 'Token not exist. make sure you have logged in';
//   return global.spotifyToken;
// };
