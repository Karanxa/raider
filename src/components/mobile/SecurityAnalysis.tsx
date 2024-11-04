import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Lock, FileWarning } from "lucide-react";

interface SecurityAnalysisProps {
  apk: any;
}

const SecurityAnalysis = ({ apk }: SecurityAnalysisProps) => {
  const getDangerousPermissions = (permissions: string[]) => {
    const dangerous = [
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.CAMERA',
      'android.permission.READ_SMS',
      'android.permission.SEND_SMS',
      'android.permission.RECORD_AUDIO',
      'android.permission.READ_PHONE_STATE',
      'android.permission.READ_CALL_LOG',
    ];
    return permissions?.filter(p => dangerous.includes(p)) || [];
  };

  const getSecurityIssues = () => {
    const issues = [];
    
    // Check for debug mode
    if (apk.manifest_content?.debuggable) {
      issues.push({
        severity: 'high',
        title: 'Debuggable Application',
        description: 'The application is debuggable, which could allow attackers to extract sensitive information.'
      });
    }

    // Check for backup enabled
    if (apk.manifest_content?.allowBackup) {
      issues.push({
        severity: 'medium',
        title: 'Backup Enabled',
        description: 'Application backup is enabled, potentially exposing sensitive data.'
      });
    }

    // Check minimum SDK version
    if (parseInt(apk.min_sdk_version) < 21) {
      issues.push({
        severity: 'medium',
        title: 'Low Minimum SDK Version',
        description: 'The app supports older Android versions that may have security vulnerabilities.'
      });
    }

    // Check dangerous permissions
    const dangerousPerms = getDangerousPermissions(apk.permissions);
    if (dangerousPerms.length > 0) {
      issues.push({
        severity: 'medium',
        title: 'Dangerous Permissions',
        description: `The app requests ${dangerousPerms.length} dangerous permissions that could compromise user privacy.`
      });
    }

    return issues;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const securityIssues = getSecurityIssues();
  const dangerousPermissions = getDangerousPermissions(apk.permissions);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Security Issues</h3>
              <div className="space-y-4">
                {securityIssues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{issue.title}</h4>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                    </div>
                  </div>
                ))}
                {securityIssues.length === 0 && (
                  <div className="text-center text-muted-foreground p-4">
                    No major security issues detected
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Dangerous Permissions</h3>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {dangerousPermissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Lock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                  {dangerousPermissions.length === 0 && (
                    <div className="text-center text-muted-foreground p-4">
                      No dangerous permissions detected
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityAnalysis;