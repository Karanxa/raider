export const API_PATTERNS = [
  // REST API patterns
  { regex: /['"`](\/api\/[^'"`]+)['"`]/g, method: 'GET' },
  { regex: /['"`](\/v\d+\/[^'"`]+)['"`]/g, method: 'GET' },
  { regex: /['"`](\/rest\/[^'"`]+)['"`]/g, method: 'GET' },
  
  // HTTP method patterns
  { regex: /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /\[(['"`])(get|post|put|delete|patch)\1\]\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  
  // Common HTTP client patterns
  { regex: /fetch\(['"`]([^'"`]+)['"`]/g, method: 'GET' },
  { regex: /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /http\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  
  // Framework-specific patterns
  { regex: /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  
  // GraphQL patterns
  { regex: /['"`](\/graphql[^'"`]*)['"`]/g, method: 'POST' },
  { regex: /['"`](\/gql[^'"`]*)['"`]/g, method: 'POST' },
  
  // Additional framework patterns
  { regex: /\$http\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /request\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' }
]