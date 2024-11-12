import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Globe, Database as DatabaseIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type PostmanCollection = Database['public']['Tables']['postman_collections']['Row'];

const PostmanDashboard = () => {
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

  return (
    <div className="space-y-6">
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