export const getPort = () => process.env.PORT || 5000;
export const getAppName = () => `${process.env.APP_NAME}.herokuapp.com`;
export const getBaseURL = () => `${process.env.NODE_ENV === 'production' ? `https://${getAppName()}` : `http://localhost:${getPort()}`}`;

export const generateRandomString = (len: number) => Math
  .random()
  .toString(36)
  .substring(2, len + 2);
