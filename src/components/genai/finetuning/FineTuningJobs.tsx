import { useEffect, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FineTuningJob {
  id: string;
  model_name: string;
  dataset_type: string;
  task_type: string;
  status: string;
  colab_script: string;
  created_at: string;
}

export const FineTuningJobs = () => {
  const session = useSession();
  const [jobs, setJobs] = useState<FineTuningJob[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchJobs();
    }
  }, [session?.user?.id]);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("finetuning_jobs")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setJobs(data);
    }
  };

  const downloadScript = (script: string, jobId: string) => {
    const blob = new Blob([script], { type: "text/python" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finetuning_${jobId}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Your Generated Scripts</h3>
      
      {jobs.map((job) => (
        <Card key={job.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{job.model_name}</h4>
              <p className="text-sm text-muted-foreground">
                Task: {job.task_type} | Dataset: {job.dataset_type}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadScript(job.colab_script, job.id)}
            >
              <Download className="h-4 w-4 mr-1" />
              Download Script
            </Button>
          </div>
        </Card>
      ))}

      {jobs.length === 0 && (
        <p className="text-muted-foreground text-center py-4">
          No scripts generated yet. Generate your first script above!
        </p>
      )}
    </div>
  );
};