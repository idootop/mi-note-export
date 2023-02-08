import dotenv from 'dotenv-flow';

dotenv.config();

export const { kCookie } = process.env;

export const kIsDebug = process.env.NODE_ENV === 'development';
