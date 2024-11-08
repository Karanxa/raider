export const API_PATTERNS = [
  {
    regex: /['"`]\/api\/([^'"`]+)['"`]/g,
    method: 'GET'
  },
  {
    regex: /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
    method: 'DYNAMIC'
  },
  {
    regex: /fetch\(['"`]([^'"`]+)['"`]/g,
    method: 'GET'
  },
  {
    regex: /axios\(['"`]([^'"`]+)['"`]/g,
    method: 'GET'
  }
];