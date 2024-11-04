import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Globe, Database as DatabaseIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";

type PostmanCollection = Database['public']['Tables']['postman_collections']['Row'];

const PostmanDashboard = () => {
  const [organization, setOrganization] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const { data: collections, isLoading, refetch } = useQuery({
    queryKey: ['postman-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('postman_collections')
        .select('*')
        .order('discovered_at', { ascending: false });
      
      if (error) throw error;
      return data as PostmanCollection[];
    }
  });

  const handleScan = async () => {
    if (!organization.trim()) {
      toast.error("Please enter an organization or keyword to search");
      return;
    }

    setIsScanning(true);
    toast.info("Starting porch-pirate scan...");

    try {
      const { error, data } = await supabase.functions.invoke('porch-pirate-scan', {
        body: { organization: organization.trim() }
      });
      
      if (error) throw error;

      toast.success(`Found ${data?.collectionsFound || 0} collections`);
      refetch();
    } catch (error) {
      toast.error("Failed to start scanner: " + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Postman Collections</h2>
          <p className="text-muted-foreground">
            Discover public Postman API collections using porch-pirate
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <Input
          placeholder="Enter organization name or keyword (e.g., stripe, payment)"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleScan} disabled={isScanning}>
          <Search className="mr-2 h-4 w-4" />
          {isScanning ? "Scanning..." : "Start Scanner"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">Loading collections...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections?.map((collection) => (
            <Card key={collection.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5" />
                  {collection.collection_name || 'Unnamed Collection'}
                </CardTitle>
                <CardDescription>
                  {collection.organization && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {collection.organization}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {collection.description || 'No description available'}
                </p>
                <div className="flex justify-between items-center">
                  <Button variant="outline" asChild>
                    <a href={collection.collection_url} target="_blank" rel="noopener noreferrer">
                      View Collection
                    </a>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Found: {new Date(collection.discovered_at!).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostmanDashboard;