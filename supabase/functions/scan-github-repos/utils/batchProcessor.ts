import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { analyzeFileContent, isRelevantFile } from './fileAnalyzer.ts';
import { fetchFileContent } from './githubApi.ts';
import { performSecurityCheck } from './securityChecker.ts';

const BATCH_SIZE = 5;
const BATCH_DELAY = 1000;

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
          // Save API findings
          const apiFindings = await Promise.all(findings.map(finding =>
            this.supabaseAdmin
              .from('github_api_findings')
              .insert({
                user_id: userId,
                repository_name: repoInfo.repo,
                repository_url: repoInfo.url,
                repository_owner: repoInfo.owner,
                api_path: finding.path,
                method: finding.method,
                file_path: file.path,
                line_number: finding.lineNumber,
              })
              .select()
          ));

          // Perform security checks for each API endpoint
          for (const finding of findings) {
            if (finding.path.startsWith('http')) {
              const securityIssues = await performSecurityCheck(finding.path);
              
              // Save security issues
              await Promise.all(securityIssues.map(issue =>
                this.supabaseAdmin
                  .from('api_security_issues')
                  .insert({
                    user_id: userId,
                    finding_id: apiFindings[0].data[0].id,
                    vulnerability_type: issue.vulnerability_type,
                    severity: issue.severity,
                    description: issue.description,
                    recommendation: issue.recommendation,
                    owasp_category: issue.owasp_category,
                    target_url: finding.path
                  })
              ));
            }
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
      }
    });

    await Promise.all(batchPromises);
  }
}