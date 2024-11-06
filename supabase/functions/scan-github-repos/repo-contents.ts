export async function fetchRepoContents(repo: any, githubToken: string | null) {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json'
  };

  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }

  const branches = ['main', 'master', 'develop', 'dev'];
  
  for (const branch of branches) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo.full_name}/git/trees/${branch}?recursive=1`,
        { headers }
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