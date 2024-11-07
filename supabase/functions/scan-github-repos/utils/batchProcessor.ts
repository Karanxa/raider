import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { analyzeFileContent, isRelevantFile } from './fileAnalyzer.ts';
import { fetchFileContent } from './githubApi.ts';

const BATCH_SIZE = 5;
const BATCH_DELAY = 1000; // 1 second delay between batches

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  download_url: string | null;
}

export class BatchProcessor {
  private processedFiles: Set<string>;
  private supabaseAdmin: any;
  
  constructor() {
    this.processedFiles = new Set();
    this.supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async processBatch(
    files: GitHubFile[],
    userId: string,
    repoInfo: { owner: string; repo: string; url: string }
  ) {
    const relevantFiles = files.filter(
      file => file.download_url && 
      isRelevantFile(file.path) && 
      !this.processedFiles.has(file.path)
    );

    for (let i = 0; i < relevantFiles.length; i += BATCH_SIZE) {
      const batch = relevantFiles.slice(i, i + BATCH_SIZE);
      await this.processFileBatch(batch, userId, repoInfo);
      
      if (i + BATCH_SIZE < relevantFiles.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
  }

  private async processFileBatch(
    batch: GitHubFile[],
    userId: string,
    repoInfo: { owner: string; repo: string; url: string }
  ) {
    const batchPromises = batch.map(async file => {
      if (this.processedFiles.has(file.path)) return null;
      this.processedFiles.add(file.path);

      try {
        const content = await fetchFileContent(file.download_url!);
        const findings = analyzeFileContent(content, file.path);

        if (findings.length > 0) {
          await this.saveFindingsToDatabase(findings, file, userId, repoInfo);
        }
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
      }
    });

    await Promise.all(batchPromises);
  }

  private async saveFindingsToDatabase(
    findings: any[],
    file: GitHubFile,
    userId: string,
    repoInfo: { owner: string; repo: string; url: string }
  ) {
    const { owner, repo, url } = repoInfo;
    
    await Promise.all(findings.map(finding =>
      this.supabaseAdmin
        .from('github_api_findings')
        .insert({
          user_id: userId,
          repository_name: repo,
          repository_url: url,
          repository_owner: owner,
          api_path: finding.path,
          method: finding.method,
          file_path: file.path,
          line_number: finding.lineNumber,
        })
    ));
  }
}