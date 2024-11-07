import { useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const TEST_TYPES = [
  "Prompt Injection",
  "Data Extraction",
  "Jailbreak Attempts",
  "PII Handling",
  "Output Validation"
] as const;

const RISK_LEVELS = ["Low", "Medium", "High"] as const;

export const ModelSecurityTesting = () => {
  const [modelEndpoint, setModelEndpoint] = useState("");
  const [testType, setTestType] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [isTesting, setIsTesting] = useState(false);
  const session = useSession();

  const runSecurityTest = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to run security tests");
      return;
    }

    if (!modelEndpoint || !testType || !riskLevel) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.from('model_security_tests').insert({
        user_id: session.user.id,
        model_endpoint: modelEndpoint,
        test_type: testType,
        risk_level: riskLevel,
        vulnerabilities: [],
        recommendations: [],
        test_status: 'pending'
      }).select().single();

      if (error) throw error;

      // Trigger the security test
      const testResponse = await supabase.functions.invoke('model-security-test', {
        body: { 
          testId: data.id,
          modelEndpoint,
          testType,
          riskLevel
        }
      });

      if (testResponse.error) throw testResponse.error;

      toast.success("Security test completed successfully");
    } catch (error) {
      console.error('Security test error:', error);
      toast.error("Failed to complete security test");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Model Security Testing</h2>
          <p className="text-muted-foreground">
            Test your model endpoints for security vulnerabilities and receive detailed recommendations.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model Endpoint</Label>
            <Input
              placeholder="Enter your model endpoint URL"
              value={modelEndpoint}
              onChange={(e) => setModelEndpoint(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Test Type</Label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                {TEST_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Risk Level</Label>
            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={runSecurityTest}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? "Running Security Test..." : "Run Security Test"}
          </Button>
        </div>
      </div>
    </Card>
  );
};