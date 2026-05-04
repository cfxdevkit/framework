export const TOKEN_KEY = 'showcase-stack.siwe.token';

export interface MeResult {
  address: string;
  issuedAt: number;
  expiresAt: number;
}

interface SiweResultsProps {
  signedMsg: string | null;
  token: string | null;
  me: MeResult | null;
  error: string | null;
}

export function SiweResults({ signedMsg, token, me, error }: SiweResultsProps) {
  return (
    <>
      {signedMsg && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Signed SIWE message
          </div>
          <pre className="result" style={{ whiteSpace: 'pre-wrap' }}>
            {signedMsg}
          </pre>
        </div>
      )}
      {token && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Bearer token (stored in localStorage)
          </div>
          <pre className="result">{token}</pre>
        </div>
      )}
      {me && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            GET /auth/me
          </div>
          <table className="status-table">
            <tbody>
              <tr>
                <th>address</th>
                <td className="mono">{me.address}</td>
              </tr>
              <tr>
                <th>issuedAt</th>
                <td>{new Date(me.issuedAt).toLocaleString()}</td>
              </tr>
              <tr>
                <th>expiresAt</th>
                <td>{new Date(me.expiresAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </>
  );
}
