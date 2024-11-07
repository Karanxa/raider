import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';

const Dashboard = () => {
  const [scanning, setScanning] = useState(false);
  const session = useSession();

  return (
    <Card className="p-6">
      <div className="text-center text-gray-500">
        <p>Welcome to Simrata Security Dashboard</p>
      </div>
    </Card>
  );
};

export default Dashboard;