import 'server-only';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.DATABASE_URL ?? 'file:local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

export const db = drizzle({ connection: { url, authToken }, schema });
