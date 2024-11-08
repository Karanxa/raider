interface SecurityIssue {
  vulnerability_type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  owasp_category: string;
}

export const scanApiEndpoint = (
  apiPath: string,
  method: string,
): SecurityIssue[] => {
  const issues: SecurityIssue[] = [];

  // Check for sensitive information in URL
  if (apiPath.toLowerCase().includes('token') || 
      apiPath.toLowerCase().includes('key') || 
      apiPath.toLowerCase().includes('secret')) {
    issues.push({
      vulnerability_type: 'Sensitive Information Exposure',
      severity: 'high',
      description: 'API endpoint contains sensitive information in the URL',
      recommendation: 'Remove sensitive information from URLs and pass them in headers or request body',
      owasp_category: 'API2:2019 Broken Authentication'
    });
  }

  // Check for potential injection points
  if (apiPath.includes('{') && method !== 'GET') {
    issues.push({
      vulnerability_type: 'Potential Injection Point',
      severity: 'medium',
      description: 'Dynamic parameters in non-GET requests could be vulnerable to injection attacks',
      recommendation: 'Implement proper input validation and sanitization for path parameters',
      owasp_category: 'API8:2019 Injection'
    });
  }

  // Check for missing versioning
  if (!apiPath.includes('/v1/') && !apiPath.includes('/v2/')) {
    issues.push({
      vulnerability_type: 'Missing API Versioning',
      severity: 'low',
      description: 'API endpoint does not include version information',
      recommendation: 'Implement API versioning to ensure backward compatibility',
      owasp_category: 'API7:2019 Security Misconfiguration'
    });
  }

  // Method-specific checks
  if (method === 'GET' && apiPath.toLowerCase().includes('admin')) {
    issues.push({
      vulnerability_type: 'Sensitive Functionality Exposure',
      severity: 'high',
      description: 'Administrative endpoints should not be accessible via GET requests',
      recommendation: 'Use POST for administrative actions and implement proper access controls',
      owasp_category: 'API5:2019 Broken Function Level Authorization'
    });
  }

  return issues;
};