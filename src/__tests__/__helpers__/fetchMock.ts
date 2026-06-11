export const fakeSession = { access_token: 'tok' } as any;

export function createFetchMock() {
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = mockFetch;

  function mockResponse(body: unknown, ok = true, status = 200) {
    mockFetch.mockResolvedValueOnce({ ok, status, json: async () => body } as Response);
  }

  return { mockFetch, mockResponse };
}
