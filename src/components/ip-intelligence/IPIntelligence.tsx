import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IPForm, FormSchema } from "./IPForm";
import { ResultCards } from "./ResultCards";

const IPIntelligence = () => {
  const [scanning, setScanning] = useState(false);

  const { data: results, refetch } = useQuery({
    queryKey: ["ip-intelligence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_intelligence_results")
        .select("*")
        .order("scan_timestamp", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data[0];
    },
    enabled: false,
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      setScanning(true);
      const response = await supabase.functions.invoke("ip-intelligence", {
        body: { ipAddress: data.ipAddress },
      });

      if (response.error) throw response.error;
      await refetch();
      toast.success("IP Intelligence scan completed");
    } catch (error) {
      toast.error("Failed to scan IP address");
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const formatJson = (data: any) => {
    if (!data) return "No data available";
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <IPForm onSubmit={onSubmit} scanning={scanning} />
      {results && <ResultCards results={results} formatJson={formatJson} />}
    </div>
  );
};

export default IPIntelligence;