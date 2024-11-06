export const API_PATTERNS = [
  { regex: /['"`](\/api\/[^'"`]+)['"`]/g, method: 'GET' },
  { regex: /['"`](\/v\d+\/[^'"`]+)['"`]/g, method: 'GET' },
  { regex: /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /fetch\(['"`]([^'"`]+)['"`]/g, method: 'GET' },
  { regex: /axios\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' },
  { regex: /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi, method: 'DYNAMIC' }
]