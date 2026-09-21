const KNOWN_FAILURES: ReadonlyArray<[RegExp, string]> = [
  [
    /InvalidNonce|invalid input nonce/i,
    'Another operation was still pending — check your activity before retrying',
  ],
  [/InsufficientBalance/, 'Balance was too low when the operation executed'],
  [/InsufficientShares/, 'Earn balance was too low when the withdrawal executed'],
  [
    /InvalidSignature|InvalidWithdrawSignature|signature does not match/i,
    'Signature no longer matched — try again',
  ],
  [/Too Many Requests|\b429\b/i, 'The network was busy — try again'],
]

// Services appends the underlying error to its recovery warnings ("…; refund
// failed, manual recovery required: <error>"). Those must reach the user as
// written — a matched substring must never turn them into retry advice.
const MUST_PRESERVE = /manual recovery|outcome unknown/i

export const describeFailure = (error: string): string => {
  if (MUST_PRESERVE.test(error)) return error
  return KNOWN_FAILURES.find(([pattern]) => pattern.test(error))?.[1] ?? error
}
