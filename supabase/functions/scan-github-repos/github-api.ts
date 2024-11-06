import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { API_PATTERNS } from './api-patterns.ts';
import { detectPIITypes } from '../../src/utils/piiPatterns.ts';
import { fetchRepoContents } from './repo-contents.ts';
import { processRepoFiles } from './file-processor.ts';

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Token rotation setup
const GITHUB_TOKENS = [
  Deno.env.get('GITHUB_TOKEN_1'),
  Deno.env.get('GITHUB_TOKEN_2'),
  Deno.env.get('GITHUB_TOKEN_3'),
  Deno.env.get('GITHUB_TOKEN_4'),
  Deno.env.get('GITHUB_TOKEN_5'),
].filter(Boolean);

let currentTokenIndex = 0;

function getNextToken() {
  currentTokenIndex = (currentTokenIndex + 1) % GITHUB_TOKENS.length;
  return GITHUB_TOKENS[currentTokenIndex];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error.status === 403 || error.status === 429) {
      console.log('Rate limit hit, switching token...');
      if (retries > 0) {
        await sleep(RETRY_DELAY);
        return retryOperation(operation, retries - 1);
      }
    }
    throw error;
  }
}

export async function fetchRepositories(userGithubToken: string | null, includePrivateRepos: boolean, orgName?: string | null) {
  const repos = [];
  let page = 1;
  
  // Use user token if provided, otherwise use system tokens
  const getAuthHeaders = () => {
    const token = userGithubToken || getNextToken();
    return {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };
  };

  // Determine the appropriate API endpoint based on the scan type
  let apiUrl: string;
  if (orgName) {
    apiUrl = `https://api.github.com/orgs/${orgName}/repos`;
  } else if (userGithubToken) {
    apiUrl = 'https://api.github.com/user/repos';
  } else {
    apiUrl = 'https://api.github.com/repositories';
  }

  console.log(`Using API endpoint: ${apiUrl}`);

  while (true) {
    try {
      console.log(`Fetching page ${page}`);
      const response = await retryOperation(async () => {
        const headers = getAuthHeaders();
        const res = await fetch(`${apiUrl}?per_page=100&page=${page}`, { headers });
        
        if (!res.ok) {
          const error = new Error(`GitHub API error: ${res.status} - ${res.statusText}`);
          (error as any).status = res.status;
          throw error;
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

      console.log(`Found ${validRepos.length} valid repositories on page ${page}`);
      repos.push(...validRepos);
      page++;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  return repos;
}

export async function fetchRepositoryContents(repo: any, userGithubToken: string | null) {
  const branches = ['main', 'master', 'develop', 'dev'];
  
  const getAuthHeaders = () => {
    const token = userGithubToken || getNextToken();
    return {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };
  };

  for (const branch of branches) {
    try {
      const response = await retryOperation(async () => {
        const headers = getAuthHeaders();
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, {
          headers
        });
        
        if (!res.ok) {
          const error = new Error(`GitHub API error: ${res.status} - ${res.statusText}`);
          (error as any).status = res.status;
          throw error;
        }
        
        return res;
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching ${branch} branch:`, error);
    }
  }

  throw new Error('No valid branch found');
}

export async function fetchFileContent(repo: any, filePath: string, userGithubToken: string | null) {
  const getAuthHeaders = () => {
    const token = userGithubToken || getNextToken();
    return {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`
    };
  };

  const response = await retryOperation(async () => {
    const headers = getAuthHeaders();
    const res = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
      headers
    });
    
    if (!res.ok) {
      const error = new Error(`Failed to fetch file content: ${res.statusText}`);
      (error as any).status = res.status;
      throw error;
    }
    
    return res;
  });

  return await response.json();
}

export async function processFilesBatch(repo: any, files: any[], githubToken: string | null, supabaseClient: any, userId: string) {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const fileContent = await fetchFileContent(repo, file.path, githubToken);
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
