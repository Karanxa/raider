const PUBLIC_TOKENS: string[] = [];

let currentTokenIndex = 0;

export function getNextToken(): string | null {
  if (PUBLIC_TOKENS.length === 0) {
    return null;
  }
  currentTokenIndex = (currentTokenIndex + 1) % PUBLIC_TOKENS.length;
  return PUBLIC_TOKENS[currentTokenIndex];
}

export function initializeTokenPool() {
  // Clear existing tokens
  PUBLIC_TOKENS.length = 0;
  
  // Add tokens from environment variables
  for (let i = 1; i <= 5; i++) {
    const token = Deno.env.get(`GITHUB_TOKEN_${i}`);
    if (token) {
      PUBLIC_TOKENS.push(token);
    }
  }
}

export function getAuthHeaders(providedToken: string | null, isPrivate: boolean = false): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (isPrivate && providedToken) {
    headers['Authorization'] = `token ${providedToken}`;
  } else if (!isPrivate) {
    const poolToken = getNextToken();
    if (poolToken) {
      headers['Authorization'] = `token ${poolToken}`;
    }
  }

  return headers;
}