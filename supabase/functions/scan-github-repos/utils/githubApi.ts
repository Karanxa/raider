const TIMEOUT_MS = 30000;

export const fetchGitHubContent = async (
  owner: string,
  repo: string,
  path: string,
  githubToken: string
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase Function'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded');
      }
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout fetching GitHub content for ${path}`);
    }
    console.error(`Error fetching GitHub content for ${path}:`, error);
    throw error;
  }
};

export const fetchFileContent = async (downloadUrl: string): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(downloadUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Supabase Function'
      }
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Timeout fetching file content from ${downloadUrl}`);
    }
    console.error(`Error fetching file content from ${downloadUrl}:`, error);
    throw error;
  }
};