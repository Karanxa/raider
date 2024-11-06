import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrgScanFormProps {
  onScan: (params: any) => Promise<void>;
  isScanning: boolean;
}

export const OrgScanForm = ({ onScan, isScanning }: OrgScanFormProps) => {
  const [githubToken, setGithubToken] = useState("");
  const [orgName, setOrgName] = useState("");
  const [includePrivateRepos, setIncludePrivateRepos] = useState(false);

  const handleSubmit = () => {
    if (!orgName) {
      toast.error("Please enter an organization name");
      return;
    }

    if (includePrivateRepos && !githubToken) {
      toast.error("GitHub token is required for scanning private repositories");
      return;
    }

    onScan({
      githubToken,
      orgName,
      includePrivateRepos
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization Name</Label>
        <Input
          id="org-name"
          type="text"
          placeholder="e.g., github"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full"
        />
        <p className="text-sm text-muted-foreground">
          Enter the GitHub organization name
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="private-repos"
          checked={includePrivateRepos}
          onCheckedChange={setIncludePrivateRepos}
        />
        <Label htmlFor="private-repos">Include Private Repositories</Label>
      </div>

      {includePrivateRepos && (
        <div className="space-y-2">
          <Label htmlFor="github-token">GitHub Personal Access Token</Label>
          <Input
            id="github-token"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Token requires 'repo' scope. Create one in GitHub Settings → Developer settings → Personal access tokens
          </p>
        </div>
      )}

      <Button 
        onClick={handleSubmit} 
        disabled={isScanning}
        className="w-full"
      >
        {isScanning ? "Scanning..." : "Start Organization Scan"}
      </Button>
    </div>
  );
};