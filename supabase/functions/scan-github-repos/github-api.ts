import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { API_PATTERNS } from './api-patterns.ts';

const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const PII_PATTERNS = {
  // Personal Information
  NAME: {
    patterns: [
      /name/i,
      /firstname/i,
      /lastname/i,
      /fullname/i,
    ],
    category: 'Name'
  },
  ADDRESS: {
    patterns: [
      /address/i,
      /street/i,
      /city/i,
      /state/i,
      /country/i,
      /zipcode/i,
      /postal/i,
    ],
    category: 'Address'
  },
  CONTACT: {
    patterns: [
      /phone/i,
      /mobile/i,
      /email/i,
      /contact/i,
    ],
    category: 'Contact Information'
  },
  FINANCIAL: {
    patterns: [
      /credit.*card/i,
      /card.*number/i,
      /cvv/i,
      /ccv/i,
      /payment/i,
      /bank/i,
      /account/i,
    ],
    category: 'Financial Information'
  },
  GOVERNMENT_ID: {
    patterns: [
      /ssn/i,
      /social.*security/i,
      /passport/i,
      /driver.*license/i,
      /national.*id/i,
      /tax.*id/i,
    ],
    category: 'Government ID'
  },
  HEALTH: {
    patterns: [
      /health/i,
      /medical/i,
      /patient/i,
      /prescription/i,
    ],
    category: 'Health Information'
  }
};

export const detectPIITypes = (apiPath: string): string[] => {
  const detectedTypes = new Set<string>();
  
  Object.entries(PII_PATTERNS).forEach(([_, pattern]) => {
    pattern.patterns.forEach(regex => {
      if (regex.test(apiPath)) {
        detectedTypes.add(pattern.category);
      }
    });
  });
  
  return Array.from(detectedTypes);
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation, ${retries} attempts remaining`);
      await sleep(RETRY_DELAY);
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export async function fetchRepositories(githubToken: string) {
  const repos = [];
  let page = 1;

  while (true) {
    const response = await retryOperation(() =>
      fetch(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.length === 0) break;

    repos.push(...data);
    page++;
  }

  return repos;
}

export async function fetchRepositoryContents(repo: any, githubToken: string) {
  const branches = ['main', 'master', 'develop', 'dev'];

  for (const branch of branches) {
    try {
      const response = await retryOperation(() =>
        fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
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

export async function fetchFileContent(repo: any, filePath: string, githubToken: string) {
  const response = await retryOperation(() =>
    fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content: ${response.statusText}`);
  }

  return await response.json();
}

export async function processFilesBatch(repo: any, files: any[], githubToken: string, supabaseClient: any, userId: string) {
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
                
                // Check if this API endpoint already exists for this repository
                const { data: existingFindings } = await supabaseClient
                  .from('github_api_findings')
                  .select('id')
                  .eq('repository_name', repo.name)
                  .eq('api_path', apiPath)
                  .eq('method', method)
                  .eq('user_id', userId);

                // Only add if it's a new finding
                if (!existingFindings || existingFindings.length === 0) {
                  findings.push({
                    repository_name: repo.name,
                    repository_url: repo.html_url,
                    api_path: apiPath,
                    method: method,
                    file_path: file.path,
                    line_number: i + 1,
                    user_id: userId,
                    pii_classification: piiTypes.length > 0,
                    pii_types: piiTypes,
                    file_content: content // Store file content for better API contract analysis
                  });
                }
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
