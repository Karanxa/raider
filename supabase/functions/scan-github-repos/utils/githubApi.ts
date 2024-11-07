export const fetchGitHubContent = async (
  owner: string,
  repo: string,
  path: string,
  githubToken: string
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching GitHub content for ${path}:`, error);
    throw error;
  }
};

export const fetchFileContent = async (downloadUrl: string): Promise<string> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(downloadUrl, { signal: controller.signal });
    clearTimeout(timeout);
    return await response.text();
  } catch (error) {
    console.error(`Error fetching file content from ${downloadUrl}:`, error);
    throw error;
  }
};