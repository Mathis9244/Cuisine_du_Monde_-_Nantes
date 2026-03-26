import { StartupImportService } from './startup-import.service';

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon_key_example_1234567890';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key_example_1234567890';
});

jest.mock('../../lib/supabase/admin.client', () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === 'startup_import_runs') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { key: 'initial' }, error: null }),
            }),
          }),
        };
      }
      return {
        upsert: async () => ({ error: null }),
        insert: async () => ({ error: null }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    },
  }),
}));

describe('StartupImportService', () => {
  it('is idempotent when marker exists', async () => {
    const svc = new StartupImportService();
    const res = await svc.runInitialImport();
    expect(res).toEqual({ imported: 0, skipped: true });
  });
});

