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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  ipAddress: z.string().min(1, "IP address is required").regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address format"),
});

const IPIntelligence = () => {
  const [scanning, setScanning] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter IP address (e.g., 8.8.8.8)" {...field} />
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
                <dt className="font-medium">Scan Timestamp</dt>
                <dd className="text-sm">
                  {new Date(results.scan_timestamp).toLocaleString()}
                </dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ASN Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <dt className="font-medium">ASN</dt>
                <dd className="text-sm">{results.asn_info?.asn || "N/A"}</dd>
                <dt className="font-medium">Organization</dt>
                <dd className="text-sm">{results.asn_info?.asn_org || "N/A"}</dd>
                <dt className="font-medium">Network</dt>
                <dd className="text-sm">{results.asn_info?.network || "N/A"}</dd>
                <dt className="font-medium">Additional Info</dt>
                <dd>
                  <pre className="text-sm whitespace-pre-wrap mt-2 bg-muted p-2 rounded">
                    {formatJson(results.asn_info)}
                  </pre>
                </dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DNS Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">A Records</h4>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                    {formatJson(results.dns_records?.a_records)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AAAA Records</h4>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                    {formatJson(results.dns_records?.aaaa_records)}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium mb-2">TXT Records</h4>
                  <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                    {formatJson(results.dns_records?.txt_records)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geolocation</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <dt className="font-medium">Location</dt>
                <dd className="text-sm">
                  {results.geolocation?.city}, {results.geolocation?.region}, {results.geolocation?.country}
                </dd>
                <dt className="font-medium">Coordinates</dt>
                <dd className="text-sm">
                  {results.geolocation?.latitude}, {results.geolocation?.longitude}
                </dd>
                <dt className="font-medium">Timezone</dt>
                <dd className="text-sm">{results.geolocation?.timezone || "N/A"}</dd>
                <dt className="font-medium">ISP</dt>
                <dd className="text-sm">{results.geolocation?.isp || "N/A"}</dd>
                <dt className="font-medium">Additional Info</dt>
                <dd>
                  <pre className="text-sm whitespace-pre-wrap mt-2 bg-muted p-2 rounded">
                    {formatJson(results.geolocation)}
                  </pre>
                </dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MX Records</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                {formatJson(results.mx_records)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nameservers</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                {formatJson(results.nameservers)}
              </pre>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>WHOIS Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                {formatJson(results.whois_data)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IPIntelligence;