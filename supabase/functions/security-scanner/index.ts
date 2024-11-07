import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { repository_url, userId } = await req.json();
    
    if (!repository_url) {
      throw new Error('Repository URL is required');
    }

    const urlParts = repository_url.split('/');
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    const githubToken = Deno.env.get('GITHUB_TOKEN_1');
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apis = await scanGitHubRepo(owner, repo, githubToken);
    
    for (const api of apis) {
      // Store API finding
      const { data: finding } = await supabaseAdmin
        .from('github_api_findings')
        .insert({
          user_id: userId,
          repository_name: repo,
          repository_url,
          repository_owner: owner,
          api_path: api.path,
          method: api.method,
          file_path: api.filePath,
          line_number: api.lineNumber,
        })
        .select()
        .single();

      // Perform OWASP security checks
      if (api.path.startsWith('http')) {
        const securityIssues = await performSecurityCheck(api.path);
        
        // Store security issues
        await Promise.all(securityIssues.map(issue =>
          supabaseAdmin
            .from('api_security_issues')
            .insert({
              user_id: userId,
              finding_id: finding.id,
              vulnerability_type: issue.type,
              severity: issue.severity,
              description: issue.description,
              recommendation: issue.recommendation,
              owasp_category: issue.category,
              target_url: api.path
            })
        ));
      }
    }

    return new Response(
      JSON.stringify({ message: 'Repository scan completed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scanGitHubRepo(owner: string, repo: string, token: string) {
  const apis: any[] = [];
  const processedPaths = new Set<string>();
  
  async function scanDirectory(path = '') {
    if (processedPaths.has(path)) return;
    processedPaths.add(path);
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'SecurityScanner'
        }
      }
    );

    if (!response.ok) throw new Error('GitHub API error');
    const contents = await response.json();

    for (const item of Array.isArray(contents) ? contents : [contents]) {
      if (item.type === 'file' && isRelevantFile(item.name)) {
        const fileContent = await fetchFileContent(item.download_url);
        const findings = analyzeFileContent(fileContent, item.path);
        apis.push(...findings);
      } else if (item.type === 'dir') {
        await scanDirectory(item.path);
      }
    }
  }

  await scanDirectory();
  return apis;
}

function isRelevantFile(fileName: string): boolean {
  const relevantExtensions = ['.js', '.ts', '.jsx', '.tsx', '.vue', '.php', '.py', '.rb'];
  return relevantExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

async function fetchFileContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch file content');
  return await response.text();
}

function analyzeFileContent(content: string, filePath: string) {
  const findings = [];
  const lines = content.split('\n');
  const apiPatterns = [
    /['"`](\/api\/[^'"`]+)['"`]/g,
    /['"`](https?:\/\/[^'"`]+)['"`]/g,
    /\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
    /fetch\(['"`]([^'"`]+)['"`]/g,
    /axios\.[a-z]+\(['"`]([^'"`]+)['"`]/gi,
  ];

  lines.forEach((line, index) => {
    apiPatterns.forEach(pattern => {
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
            filePath,
            lineNumber: index + 1,
          });
        }
      }
    });
  });

  return findings;
}

async function performSecurityCheck(apiEndpoint: string) {
  const issues = [];
  
  try {
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: { 'User-Agent': 'SecurityScanner/1.0' }
    });

    const headers = response.headers;
    
    // Security Headers Check
    if (!headers.get('x-frame-options')) {
      issues.push({
        type: "Missing X-Frame-Options",
        severity: "medium",
        description: "X-Frame-Options header is missing, potentially exposing the API to clickjacking attacks",
        recommendation: "Add X-Frame-Options header with DENY or SAMEORIGIN value",
        category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('strict-transport-security')) {
      issues.push({
        type: "Missing HSTS",
        severity: "high",
        description: "HTTP Strict Transport Security header is missing",
        recommendation: "Implement HSTS with appropriate max-age",
        category: "A05:2021 – Security Misconfiguration"
      });
    }

    if (!headers.get('content-security-policy')) {
      issues.push({
        type: "Missing CSP",
        severity: "high",
        description: "Content Security Policy header is missing",
        recommendation: "Implement a strict Content Security Policy",
        category: "A03:2021 – Injection"
      });
    }

    // SSL/TLS Check
    if (!apiEndpoint.startsWith('https://')) {
      issues.push({
        type: "Insecure Protocol",
        severity: "critical",
        description: "The API endpoint is not using HTTPS",
        recommendation: "Enable HTTPS for all API endpoints",
        category: "A02:2021 – Cryptographic Failures"
      });
    }
  } catch (error) {
    console.error('Security check error:', error);
  }

  return issues;
}