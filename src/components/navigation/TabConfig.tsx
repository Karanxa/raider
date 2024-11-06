import { FileCode, Shield, Package, AlertTriangle, Database, Brain, Target, Smartphone, Settings, Search, List } from "lucide-react";

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
    value: "api-security",
    label: "API Security",
    icon: <Shield className="h-4 w-4" />,
    tabs: [
      { value: "scan", label: "GitHub Scan", icon: <Search className="h-4 w-4" /> },
      { value: "findings", label: "API Findings", icon: <List className="h-4 w-4" /> },
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
      { value: "finetuning", label: "Fine-tuning", icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    value: "mobile",
    label: "Mobile Security",
    icon: <Smartphone className="h-4 w-4" />,
    tabs: [
      { value: "upload", label: "APK Upload", icon: <FileCode className="h-4 w-4" /> },
      { value: "dashboard", label: "APK Dashboard", icon: <Database className="h-4 w-4" /> },
    ],
  },
  {
    value: "bounty",
    label: "Bounty",
    icon: <Target className="h-4 w-4" />,
    tabs: [
      { value: "reporting", label: "Reporting", icon: <FileCode className="h-4 w-4" /> },
    ],
  },
];
