import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { FileArchive, Loader2 } from "lucide-react";

const ApkDashboard = () => {
  const navigate = useNavigate();

  const { data: apkList, isLoading } = useQuery({
    queryKey: ['apk-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apk_analysis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apkList?.map((apk) => (
        <Card
          key={apk.id}
          className="p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">{apk.apk_name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Package: {apk.package_name || 'Analyzing...'}</p>
                <p>Version: {apk.version_name || 'Analyzing...'}</p>
                <p>Status: {apk.status}</p>
                <p className="text-xs">
                  Uploaded: {new Date(apk.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <FileArchive className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(`/apk/${apk.id}`)}
            >
              View Analysis
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ApkDashboard;