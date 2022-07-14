/* eslint-disable vars-on-top, no-var, no-unused-vars */

type SpotifyToken = {
    accessToken: string
    refreshToken: string
    tokenType: string
};

declare global {
    var spotifyToken: SpotifyToken | undefined;
    var port: string | number;
    var appName: string;
}

export {};
