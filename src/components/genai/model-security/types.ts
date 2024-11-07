export interface Vulnerability {
  name: string;
  severity: string;
  description: string;
  recommendation?: string;
}

export interface TestResults {
  overallRisk: string;
  vulnerabilities: Vulnerability[];
  recommendations?: string[];
}