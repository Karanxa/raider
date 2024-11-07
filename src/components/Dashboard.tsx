import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">LLM Scanner</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Test LLM models for security vulnerabilities
          </p>
          <Button onClick={() => navigate("/llm")}>
            Start Scanning
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">API Security</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze and test API endpoints
          </p>
          <Button onClick={() => navigate("/api")}>
            View Tools
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Mobile Security</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Analyze mobile applications
          </p>
          <Button onClick={() => navigate("/mobile")}>
            Start Analysis
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;