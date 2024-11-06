import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { API_PATTERNS } from './api-patterns.ts';
import { detectPIITypes } from './piiPatterns.ts';

const BATCH_SIZE = 10;
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 60000;

// Token pool for public repository access
const PUBLIC_TOKENS = [
  'ghp_token1', // Replace with actual tokens
  'ghp_token2',
  'ghp_token3'
];

let currentTokenIndex = 0;

function getNextToken() {
  currentTokenIndex = (currentTokenIndex + 1) % PUBLIC_TOKENS.length;
  return PUBLIC_TOKENS[currentTokenIndex];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | null = null;
  let currentDelay = INITIAL_RETRY_DELAY;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error
      if (error.message.includes('rate limit') && attempt < retries) {
        console.log(`Rate limit hit, switching tokens and retrying. Attempt ${attempt + 1}/${retries}`);
        getNextToken(); // Switch to next token
        await sleep(currentDelay);
        currentDelay = Math.min(currentDelay * 2, MAX_RETRY_DELAY); // Exponential backoff
        continue;
      }
      
      // If it's not a rate limit error or we're out of retries, throw the error
      throw lastError;
    }
  }
  throw lastError;
}

export async function fetchRepositories(githubToken: string | null, includePrivateRepos: boolean, orgName?: string | null) {
  if (!githubToken && includePrivateRepos) {
    throw new Error('GitHub token is required for scanning private repositories');
  }

  const repos = [];
  let page = 1;
  
  while (true) {
    try {
      console.log(`Fetching page ${page}`);
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };

      // Use provided token for private repos, or token pool for public repos
      const token = includePrivateRepos ? githubToken : getNextToken();
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      let apiUrl: string;
      if (orgName) {
        apiUrl = `https://api.github.com/orgs/${orgName}/repos`;
      } else if (token) {
        apiUrl = 'https://api.github.com/user/repos';
      } else {
        apiUrl = 'https://api.github.com/repositories';
      }

      const response = await retryOperation(() =>
        fetch(`${apiUrl}?per_page=100&page=${page}`, { headers })
      );

      if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 403) {
          throw new Error('rate limit');
        }
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
      }

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
  
  for (const branch of branches) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };

      // Use provided token for private repos, or token pool for public repos
      const token = repo.private ? githubToken : getNextToken();
      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await retryOperation(() =>
        fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, {
          headers
        })
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error fetching ${branch} branch:`, error);
    }
  }

  throw new Error('No valid branch found');
}

export async function fetchFileContent(repo: any, filePath: string, githubToken: string | null) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  };

  // Use provided token for private repos, or token pool for public repos
  const token = repo.private ? githubToken : getNextToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await retryOperation(() =>
    fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
      headers
    })
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

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
