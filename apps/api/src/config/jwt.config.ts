export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'rooomchi_jwt_super_secret_key_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

export interface JwtPayload {
  userId: string;
  organizationId: string;
  role: string;
  email?: string;
  employeeNumber?: string;
}
