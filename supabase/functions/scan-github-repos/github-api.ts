import { getAuthHeaders, initializeTokenPool } from './token-manager.ts';
import { retryOperation } from './retry-utils.ts';

export async function fetchRepositories(githubToken: string | null, includePrivateRepos: boolean, orgName?: string | null) {
  if (!githubToken && includePrivateRepos) {
    throw new Error('GitHub token is required for scanning private repositories');
  }

  initializeTokenPool();
  const repos = [];
  let page = 1;
  
  while (true) {
    try {
      console.log(`Fetching page ${page} of repositories`);
      const headers = getAuthHeaders(githubToken, includePrivateRepos);

      let apiUrl: string;
      if (orgName) {
        apiUrl = `https://api.github.com/orgs/${orgName}/repos`;
      } else if (githubToken) {
        apiUrl = 'https://api.github.com/user/repos';
      } else {
        apiUrl = 'https://api.github.com/repositories';
      }

      const response = await retryOperation(async () => {
        const res = await fetch(`${apiUrl}?per_page=100&page=${page}`, { headers });
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`GitHub API error: ${res.status} - ${errorData}`);
        }
        return res;
      });

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;

      const validRepos = data.filter((repo: any) => {
        if (!repo || !repo.full_name) {
          console.warn('Skipping invalid repository:', repo);
          return false;
        }
        return !includePrivateRepos ? !repo.private : true;
      });

      repos.push(...validRepos);
      page++;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  return repos;
}

export async function fetchRepositoryContents(repo: any, githubToken: string | null) {
  const branches = ['main', 'master', 'develop', 'dev'];
  const headers = getAuthHeaders(githubToken, repo.private);
  
  for (const branch of branches) {
    try {
      const response = await retryOperation(async () => {
        const res = await fetch(
          `https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`,
          { headers }
        );
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`GitHub API error: ${res.status} - ${errorData}`);
        }
        return res;
      });

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${branch} branch:`, error);
      continue;
    }
  }

  throw new Error('No valid branch found');
}

export async function processFilesBatch(repo: any, files: any[], githubToken: string | null, supabaseClient: any, userId: string) {
  const headers = getAuthHeaders(githubToken, repo.private);
  
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const response = await retryOperation(async () => {
          const res = await fetch(
            `https://api.github.com/repos/${repo.full_name}/contents/${file.path}`,
            { headers }
          );
          if (!res.ok) {
            const errorData = await res.text();
            throw new Error(`GitHub API error: ${res.status} - ${errorData}`);
          }
          return res;
        });

        const fileContent = await response.json();
        if (!fileContent.content) {
          console.warn(`No content found for file ${file.path}`);
          return 0;
        }

        const content = atob(fileContent.content);
        const findings: any[] = [];

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
