import { FileCode, Shield, Package, AlertTriangle, Database, Brain, Target } from "lucide-react";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CategoryConfig {
  value: string;
  label: string;
  icon: React.ReactNode;
  tabs: TabItem[];
}

export const categoryConfigs: CategoryConfig[] = [
  {
    value: "web",
    label: "Web Security",
    icon: <Shield className="h-4 w-4" />,
    tabs: [
      { value: "nuclei", label: "Nuclei Scanner", icon: <AlertTriangle className="h-4 w-4" /> },
      { value: "nuclei-results", label: "Nuclei Results", icon: <Database className="h-4 w-4" /> },
      { value: "postman", label: "Postman Collections", icon: <Package className="h-4 w-4" /> },
      { value: "turbo-intruder", label: "Turbo Intruder", icon: <AlertTriangle className="h-4 w-4" /> },
      { value: "ip-intelligence", label: "IP Intelligence", icon: <Shield className="h-4 w-4" /> },
      { value: "xss", label: "XSS Payloads", icon: <AlertTriangle className="h-4 w-4" /> },
    ],
  },
  {
    value: "api",
    label: "API Security",
    icon: <Database className="h-4 w-4" />,
    tabs: [
      { value: "github-scan", label: "GitHub Scanner", icon: <FileCode className="h-4 w-4" /> },
      { value: "api-findings", label: "API Findings", icon: <Database className="h-4 w-4" /> },
    ],
  },
  {
    value: "genai",
    label: "GenAI Security",
    icon: <Brain className="h-4 w-4" />,
    tabs: [
      { value: "llm", label: "LLM Scanner", icon: <Brain className="h-4 w-4" /> },
      { value: "llm-results", label: "LLM Results", icon: <Database className="h-4 w-4" /> },
      { value: "datasets", label: "Datasets", icon: <Database className="h-4 w-4" /> },
      { value: "prompt-augmentation", label: "Prompt Augmentation", icon: <FileCode className="h-4 w-4" /> },
      { value: "finetuning", label: "Fine-tuning", icon: <Target className="h-4 w-4" /> },
    ],
  },
];