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

  // OWASP API Top 10 checks
  
  // API1:2019 Broken Object Level Authorization
  if (apiPath.toLowerCase().includes('user') || apiPath.toLowerCase().includes('admin')) {
    issues.push({
      vulnerability_type: 'Object Level Authorization',
      severity: 'high',
      description: 'Endpoint may expose user data without proper authorization checks',
      recommendation: 'Implement object-level authorization checks and validate user permissions',
      owasp_category: 'API1:2019 Broken Object Level Authorization'
    });
  }

  // API2:2019 Broken Authentication
  if (apiPath.toLowerCase().includes('login') || 
      apiPath.toLowerCase().includes('auth') || 
      apiPath.toLowerCase().includes('token')) {
    issues.push({
      vulnerability_type: 'Authentication Concerns',
      severity: 'high',
      description: 'Authentication endpoint requires careful security review',
      recommendation: 'Implement rate limiting, strong password policies, and proper session management',
      owasp_category: 'API2:2019 Broken Authentication'
    });
  }

  // API3:2019 Excessive Data Exposure
  if (method === 'GET' && (apiPath.includes('all') || apiPath.includes('list'))) {
    issues.push({
      vulnerability_type: 'Excessive Data Exposure',
      severity: 'medium',
      description: 'Endpoint might expose sensitive data in responses',
      recommendation: 'Implement response filtering and ensure only necessary data is returned',
      owasp_category: 'API3:2019 Excessive Data Exposure'
    });
  }

  // API4:2019 Lack of Resources & Rate Limiting
  if (method !== 'GET' || apiPath.includes('upload')) {
    issues.push({
      vulnerability_type: 'Resource Consumption',
      severity: 'medium',
      description: 'Endpoint might be vulnerable to DoS attacks',
      recommendation: 'Implement rate limiting and resource quotas',
      owasp_category: 'API4:2019 Lack of Resources & Rate Limiting'
    });
  }

  // API5:2019 Broken Function Level Authorization
  if (apiPath.toLowerCase().includes('admin') || 
      apiPath.toLowerCase().includes('internal') ||
      apiPath.toLowerCase().includes('manage')) {
    issues.push({
      vulnerability_type: 'Function Level Authorization',
      severity: 'high',
      description: 'Administrative endpoint might be accessible to unauthorized users',
      recommendation: 'Implement proper role-based access control (RBAC)',
      owasp_category: 'API5:2019 Broken Function Level Authorization'
    });
  }

  // API6:2019 Mass Assignment
  if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && 
      (apiPath.includes('update') || apiPath.includes('create'))) {
    issues.push({
      vulnerability_type: 'Mass Assignment',
      severity: 'medium',
      description: 'Endpoint might be vulnerable to mass assignment attacks',
      recommendation: 'Implement explicit property filtering and validation',
      owasp_category: 'API6:2019 Mass Assignment'
    });
  }

  // API7:2019 Security Misconfiguration
  if (!apiPath.includes('/v1/') && !apiPath.includes('/v2/')) {
    issues.push({
      vulnerability_type: 'API Versioning',
      severity: 'low',
      description: 'API endpoint lacks version information',
      recommendation: 'Implement API versioning to ensure backward compatibility',
      owasp_category: 'API7:2019 Security Misconfiguration'
    });
  }

  // API8:2019 Injection
  if (apiPath.includes('{') && method !== 'GET') {
    issues.push({
      vulnerability_type: 'Injection Vulnerability',
      severity: 'high',
      description: 'Dynamic parameters could be vulnerable to injection attacks',
      recommendation: 'Implement proper input validation and parameterized queries',
      owasp_category: 'API8:2019 Injection'
    });
  }

  return issues;
};

export const analyzeCodeContext = (
  filePath: string,
  lineNumber: number,
  fileContent: string
): {
  parameters: any;
  requestBody: any;
  responses: any;
} => {
  const lines = fileContent.split('\n');
  const contextLines = lines.slice(Math.max(0, lineNumber - 10), lineNumber + 10);
  const context = contextLines.join('\n');

  const parameters: any = {
    path: {},
    query: [],
    headers: {}
  };

  const requestBody: any = {
    type: 'object',
    properties: {}
  };

  const responses: any = {
    '200': {
      description: 'Successful response',
      content: {}
    },
    '400': {
      description: 'Bad request',
      content: {}
    }
  };

  // Extract path parameters
  const pathParamMatches = context.match(/\{([^}]+)\}/g);
  if (pathParamMatches) {
    pathParamMatches.forEach(param => {
      const paramName = param.slice(1, -1);
      parameters.path[paramName] = {
        type: 'string',
        required: true
      };
    });
  }

  // Look for query parameters
  const queryParamMatches = context.match(/\?([^=]+)=/g);
  if (queryParamMatches) {
    queryParamMatches.forEach(param => {
      const paramName = param.slice(1, -1);
      parameters.query.push({
        name: paramName,
        in: 'query',
        schema: {
          type: 'string'
        }
      });
    });
  }

  // Try to identify request body structure
  if (context.includes('body') || context.includes('payload')) {
    const bodyMatches = context.match(/\{([^}]+)\}/g);
    if (bodyMatches) {
      bodyMatches.forEach(match => {
        try {
          const parsed = JSON.parse(match);
          Object.keys(parsed).forEach(key => {
            requestBody.properties[key] = {
              type: typeof parsed[key],
              example: parsed[key]
            };
          });
        } catch (e) {
          // Invalid JSON, skip
        }
      });
    }
  }

  // Look for response structure
  const responseMatches = context.match(/response\.(json|send)\(([^)]+)\)/g);
  if (responseMatches) {
    responseMatches.forEach(match => {
      try {
        const content = match.match(/\(([^)]+)\)/)[1];
        const parsed = JSON.parse(content);
        responses['200'].content = {
          'application/json': {
            schema: {
              type: 'object',
              properties: Object.keys(parsed).reduce((acc, key) => ({
                ...acc,
                [key]: {
                  type: typeof parsed[key],
                  example: parsed[key]
                }
              }), {})
            }
          }
        };
      } catch (e) {
        // Invalid JSON, skip
      }
    });
  }

  return {
    parameters,
    requestBody,
    responses
  };
};