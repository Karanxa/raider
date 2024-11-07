interface Finding {
  path: string;
  method: string;
  lineNumber: number;
}

const API_PATTERNS = [
  /['"`](\/api\/[^'"`]+)['"`]/g,
  /['"`](https?:\/\/[^'"`]+)['"`]/g,
  /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
  /fetch\(['"`]([^'"`]+)['"`]/g,
  /axios\.[a-z]+\(['"`]([^'"`]+)['"`]/g,
  /url:\s*['"`]([^'"`]+)['"`]/g,
  /endpoint:\s*['"`]([^'"`]+)['"`]/g,
];

export const analyzeFileContent = (content: string, filePath: string): Finding[] => {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    API_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let path = match[1];
        let method = 'GET';

        if (pattern.source.includes('get|post|put|delete|patch')) {
          method = match[1].toUpperCase();
          path = match[2];
        }

        if (path.includes('/api/') || path.includes('http')) {
          findings.push({
            path,
            method,
            lineNumber: index + 1,
          });
        }
      }
    });
  });

  return findings;
};

export const isRelevantFile = (fileName: string): boolean => {
  const relevantExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.php', '.py', '.rb'];
  return relevantExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};