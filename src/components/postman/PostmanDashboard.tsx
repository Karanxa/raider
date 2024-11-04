import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Globe, Database as DatabaseIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

type PostmanCollection = Database['public']['Tables']['postman_collections']['Row'];

const PostmanDashboard = () => {
  const [organization, setOrganization] = useState("");
  const { data: collections, isLoading } = useQuery({
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

  const handleCrawl = async () => {
    if (!organization.trim()) {
      toast.error("Please enter an organization or keyword to search");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('crawl-postman-collections', {
        body: { organization: organization.trim() }
      });
      
      if (error) throw error;
      toast.success("Crawler started successfully");
    } catch (error) {
      toast.error("Failed to start crawler");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Postman Collections</h2>
          <p className="text-muted-foreground">
            Discover and monitor public Postman API collections
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
        <Button onClick={handleCrawl}>
          <Search className="mr-2 h-4 w-4" />
          Start Crawler
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