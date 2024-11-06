import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { API_PATTERNS } from './api-patterns.ts';
import { detectPIITypes } from '../../src/utils/piiPatterns.ts';

export async function processRepoFiles(repo: any, files: any[], githubToken: string | null, supabaseClient: any, userId: string) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${repo.full_name}/contents/${file.path}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch file content: ${response.statusText}`);
        }

        const fileContent = await response.json();
        const content = atob(fileContent.content);
        const findings: any[] = [];

        // Extract owner from repo URL or full_name
        const repoOwner = repo.owner?.login || repo.full_name?.split('/')[0] || 'unknown';

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const pattern of API_PATTERNS) {
            const matches = [...line.matchAll(pattern.regex)];
            for (const match of matches) {
              const apiPath = pattern.method === 'DYNAMIC' ? match[2] : match[1];
              const method = pattern.method === 'DYNAMIC' ? match[1].toUpperCase() : pattern.method;

              if (apiPath && (
                apiPath.includes('/api/') || 
                apiPath.includes('/v1/') || 
                apiPath.includes('/v2/') ||
                apiPath.includes('/rest/') ||
                apiPath.includes('/graphql')
              )) {
                const piiTypes = detectPIITypes(apiPath);
                findings.push({
                  repository_name: repo.name,
                  repository_url: repo.html_url,
                  repository_owner: repoOwner,
                  api_path: apiPath,
                  method: method,
                  file_path: file.path,
                  line_number: i + 1,
                  user_id: userId,
                  pii_classification: piiTypes.length > 0,
                  pii_types: piiTypes
                });
              }
            }
          }
        }

        if (findings.length > 0) {
          await supabaseClient
            .from('github_api_findings')
            .insert(findings);
        }

        return findings.length;
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
        return 0;
      }
    })
  );

  return results.reduce((a, b) => a + b, 0);
}