import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function fetchRepositories(githubToken: string) {
  const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!reposResponse.ok) {
    throw new Error(`GitHub API error: ${reposResponse.statusText}`)
  }
  
  return await reposResponse.json()
}

export async function fetchRepositoryContents(repo: any, githubToken: string) {
  const contentsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/main?recursive=1`, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!contentsResponse.ok) {
    // Try master branch if main doesn't exist
    const masterResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/git/trees/master?recursive=1`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    
    if (!masterResponse.ok) {
      throw new Error('No main or master branch found')
    }
    
    return await masterResponse.json()
  }
  
  return await contentsResponse.json()
}

export async function fetchFileContent(repo: any, filePath: string, githubToken: string) {
  const fileContentResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/${filePath}`, {
    headers: {
      'Authorization': `token ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  
  if (!fileContentResponse.ok) {
    throw new Error(`Failed to fetch file content: ${fileContentResponse.statusText}`)
  }
  
  return await fileContentResponse.json()
}