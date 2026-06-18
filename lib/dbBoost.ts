/** Erreur Postgres / PostgREST quand les colonnes boost ne sont pas encore migrées. */
export function isMissingBoostColumnError(message: string): boolean {
  return /boost_until|boost_tier|column.*does not exist/i.test(message);
}
