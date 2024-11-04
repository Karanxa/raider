import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ApkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: apk, isLoading } = useQuery({
    queryKey: ['apk-analysis', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apk_analysis')
        .select('*')
        .eq('id', id)
        .single();

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

  if (!apk) {
    return <div>APK not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{apk.apk_name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <dt className="font-medium">Package Name</dt>
              <dd className="text-muted-foreground">{apk.package_name || 'N/A'}</dd>
              <dt className="font-medium">Version</dt>
              <dd className="text-muted-foreground">
                {apk.version_name} (code: {apk.version_code || 'N/A'})
              </dd>
              <dt className="font-medium">SDK Version</dt>
              <dd className="text-muted-foreground">
                Min: {apk.min_sdk_version || 'N/A'}, Target: {apk.target_sdk_version || 'N/A'}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions ({apk.permissions?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {apk.permissions?.map((permission: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {permission}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-medium mb-2">Activities ({apk.activities?.length || 0})</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {apk.activities?.map((activity: string, index: number) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Services ({apk.services?.length || 0})</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {apk.services?.map((service: string, index: number) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Receivers ({apk.receivers?.length || 0})</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {apk.receivers?.map((receiver: string, index: number) => (
                    <li key={index}>{receiver}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApkDetails;