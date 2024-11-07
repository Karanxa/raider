interface SecurityCheck {
  vulnerability_type: string;
  severity: string;
  description: string;
  recommendation: string;
  owasp_category: string;
}

export async function performSecurityCheck(apiEndpoint: string): Promise<SecurityCheck[]> {
  console.log('Performing security check for API:', apiEndpoint);
  const vulnerabilities: SecurityCheck[] = [];
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: { 'User-Agent': 'SecurityScanner/1.0' }
    });

    const headers = response.headers;
    
    // Security Headers Check
    if (!headers.get('x-frame-options')) {
      vulnerabilities.push({
        vulnerability_type: "Missing X-Frame-Options",
        severity: "medium",
        description: "X-Frame-Options header is missing, potentially exposing the API to clickjacking attacks",
        recommendation: "Add X-Frame-Options header with DENY or SAMEORIGIN value",
        owasp_category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('strict-transport-security')) {
      vulnerabilities.push({
        vulnerability_type: "Missing HSTS",
        severity: "high",
        description: "HTTP Strict Transport Security header is missing, potentially exposing the API to protocol downgrade attacks",
        recommendation: "Implement HSTS with appropriate max-age",
        owasp_category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('content-security-policy')) {
      vulnerabilities.push({
        vulnerability_type: "Missing CSP",
        severity: "high",
        description: "Content Security Policy header is missing, increasing risk of XSS attacks",
        recommendation: "Implement a strict Content Security Policy",
        owasp_category: "A03:2021 – Injection"
      });
    }

    // SSL/TLS Check
    if (!apiEndpoint.startsWith('https://')) {
      vulnerabilities.push({
        vulnerability_type: "Insecure Protocol",
        severity: "critical",
        description: "The API endpoint is not using HTTPS",
        recommendation: "Enable HTTPS for all API endpoints",
        owasp_category: "A02:2021 – Cryptographic Failures"
      });
    }

    return vulnerabilities;
  } catch (error) {
    console.error('Error during security check:', error);
    return [];
  }
}