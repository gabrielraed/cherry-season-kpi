// Constante compartida entre middleware (edge runtime) y lib/auth.ts (node runtime).
// Separada en su propio archivo para no arrastrar dependencias pesadas (prisma, bcryptjs) al edge.
export const COOKIE_NAME = "cafeteria_session";
