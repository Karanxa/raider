import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FormData {
  ipAddress: string;
}

const IPIntelligence = () => {
  const [scanning, setScanning] = useState(false);
  const form = useForm<FormData>();

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

  const onSubmit = async (data: FormData) => {
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter IP address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={scanning}>
            {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Scan IP
          </Button>
        </form>
      </Form>

      {results && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <dt className="font-medium">IP Address</dt>
                <dd className="text-sm">{results.ip_address}</dd>
                <dt className="font-medium">Reverse DNS</dt>
                <dd className="text-sm">{results.reverse_dns || "N/A"}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ASN Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.asn_info, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DNS Records</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.dns_records, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geolocation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.geolocation, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MX Records</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.mx_records, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nameservers</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.nameservers, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>WHOIS Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(results.whois_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IPIntelligence;