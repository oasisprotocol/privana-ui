// Shared auth state for tests that mock the SDK's useSiweAuth. vi.mock is
// per-file and hoisted, so each test file still declares the mock itself and
// points it at this state:
//
//   vi.mock('@oasisprotocol/privana-sdk', () => ({ useSiweAuth: () => siweAuth.state }))
//
// The state is read when the hook is called (not when the mock is created),
// so tests can reassign it between renders.
export interface MockSiweAuthState {
  session: { address: string } | null
  accessToken: string | null
}

export const siweAuth: { state: MockSiweAuthState } = {
  state: { session: null, accessToken: null },
}

export const signInAs = (address: string, accessToken = 'test-jwt') => {
  siweAuth.state = { session: { address }, accessToken }
}
