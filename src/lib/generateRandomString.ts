const generateRandomString = (len: number) => Math.random().toString(36).substring(2, len + 2);

export default generateRandomString;
