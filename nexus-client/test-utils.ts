/**
 * Shared test helpers for nexus-client unit tests.
 */

/** Builds a minimal `fetch` Response stub that resolves to `data` as JSON. */
export function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  } as Response;
}

/** Installs a `global.fetch` mock that always resolves to `data`. */
export function mockFetch(data: unknown, ok = true): jest.Mock {
  const fn = jest.fn().mockResolvedValue(jsonResponse(data, ok));
  global.fetch = fn as typeof fetch;
  return fn;
}

/** A signed-in user for seeding the zustand store in tests. */
export const TEST_USER = {
  id: '1',
  db_id: 1,
  username: 'tester',
  is_admin: false,
};

export const TEST_ADMIN = { ...TEST_USER, username: 'admin', is_admin: true };
