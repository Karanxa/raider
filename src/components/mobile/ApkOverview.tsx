import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ApkOverviewProps {
  apk: any;
  onDownload: () => void;
}

const ApkOverview = ({ apk, onDownload }: ApkOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">Package Information</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Package Name</dt>
                <dd>{apk.package_name || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Version</dt>
                <dd>{apk.version_name} (code: {apk.version_code || 'N/A'})</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">SDK Version</dt>
                <dd>Min: {apk.min_sdk_version || 'N/A'}, Target: {apk.target_sdk_version || 'N/A'}</dd>
              </div>
            </dl>
          </div>
          <div className="flex justify-end">
            <Button onClick={onDownload}>
              Download APK
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApkOverview;