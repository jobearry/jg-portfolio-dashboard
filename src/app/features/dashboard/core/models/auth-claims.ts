/**
 * Claims returned by `GET v1/auth/me`. The API groups every claim type into an
 * array of strings, including the JWT timestamps.
 */
export interface AuthClaims {
  sub: string[];
  role: string[];
  /** Not-before, Unix seconds as a string. */
  nbf: string[];
  /** Expiry, Unix seconds as a string. */
  exp: string[];
  /** Issued-at, Unix seconds as a string. */
  iat: string[];
  iss: string[];
  aud: string[];
}
