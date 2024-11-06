import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectPIITypes } from "../../../src/utils/piiPatterns.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { githubToken, userId } = await req.json();

    if (!githubToken || !userId) {
      throw new Error("GitHub token and user ID are required");
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch user's repositories
    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch repositories");
    }

    const repos = await response.json();
    console.log(`Found ${repos.length} repositories`);

    for (const repo of repos) {
      try {
        // Search for API endpoints in repository content
        const searchResponse = await fetch(
          `https://api.github.com/search/code?q=repo:${repo.full_name}+path:/+extension:js+extension:ts+extension:py+extension:rb+extension:php`,
          {
            headers: {
              Authorization: `token ${githubToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!searchResponse.ok) {
          console.error(`Error searching ${repo.full_name}:`, await searchResponse.text());
          continue;
        }

        const searchResults = await searchResponse.json();
        console.log(`Found ${searchResults.items?.length || 0} potential files in ${repo.full_name}`);

        for (const item of searchResults.items || []) {
          try {
            // Fetch file content
            const contentResponse = await fetch(item.url, {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: "application/vnd.github.v3+json",
              },
            });

            if (!contentResponse.ok) continue;

            const content = await contentResponse.json();
            const fileContent = atob(content.content);

            // Simple regex patterns for API endpoints
            const apiPatterns = [
              /\/api\/[^\s"']+/g,
              /\/v[0-9]+\/[^\s"']+/g,
              /\/rest\/[^\s"']+/g,
            ];

            for (const pattern of apiPatterns) {
              const matches = fileContent.match(pattern);
              if (!matches) continue;

              for (const apiPath of matches) {
                // Detect HTTP method
                const methodMatch = fileContent.match(
                  new RegExp(`(GET|POST|PUT|DELETE|PATCH).*${apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
                );
                const method = methodMatch ? methodMatch[1] : "GET";

                // Check for PII patterns
                const piiTypes = detectPIITypes(apiPath);
                const hasPII = piiTypes.length > 0;

                // Store the finding
                const { error: insertError } = await supabaseClient
                  .from("github_api_findings")
                  .upsert({
                    user_id: userId,
                    repository_name: repo.name,
                    repository_owner: repo.owner.login,
                    repository_url: repo.html_url,
                    api_path: apiPath,
                    method: method,
                    file_path: item.path,
                    pii_classification: hasPII,
                    pii_types: piiTypes,
                  });

                if (insertError) {
                  console.error("Error inserting finding:", insertError);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing file ${item.path}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing repository ${repo.full_name}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ message: "Repository scan completed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Scan error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});