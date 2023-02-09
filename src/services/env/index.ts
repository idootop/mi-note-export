import dotenv from 'dotenv-flow';

dotenv.config();

export const kIsDebug = process.env.NODE_ENV === 'development';
export const { kCookie = '' } = process.env;
