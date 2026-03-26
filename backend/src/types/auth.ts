export type AuthenticatedUser = {
  id: string;
  email?: string;
  role?: string;
  claims: Record<string, unknown>;
};

