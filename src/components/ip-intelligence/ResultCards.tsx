import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultCardsProps {
  results: any;
  formatJson: (data: any) => string;
}

export const ResultCards = ({ results, formatJson }: ResultCardsProps) => {
  if (!results) return null;

  return (
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
              {results.scan_timestamp ? new Date(results.scan_timestamp).toLocaleString() : "N/A"}
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
            {["a_records", "aaaa_records", "txt_records"].map((recordType) => (
              <div key={recordType}>
                <h4 className="font-medium mb-2">{recordType.toUpperCase().replace("_", " ")}</h4>
                <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
                  {formatJson(results.dns_records?.[recordType])}
                </pre>
              </div>
            ))}
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
              {[
                results.geolocation?.city,
                results.geolocation?.region,
                results.geolocation?.country,
              ]
                .filter(Boolean)
                .join(", ") || "N/A"}
            </dd>
            <dt className="font-medium">Coordinates</dt>
            <dd className="text-sm">
              {results.geolocation?.latitude && results.geolocation?.longitude
                ? `${results.geolocation.latitude}, ${results.geolocation.longitude}`
                : "N/A"}
            </dd>
            <dt className="font-medium">Timezone</dt>
            <dd className="text-sm">{results.geolocation?.timezone || "N/A"}</dd>
            <dt className="font-medium">ISP</dt>
            <dd className="text-sm">{results.geolocation?.isp || "N/A"}</dd>
          </dl>
        </CardContent>
      </Card>

      {["mx_records", "nameservers", "whois_data"].map((section) => (
        <Card key={section} className={section === "whois_data" ? "md:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle>{section.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">
              {formatJson(results[section])}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};