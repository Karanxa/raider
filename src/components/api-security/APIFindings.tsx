import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from '@supabase/auth-helpers-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FindingsFilters } from "./findings/FindingsFilters";
import { FindingsTable } from "./findings/FindingsTable";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export const APIFindings = () => {
  const session = useSession();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("_all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['api-findings', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching findings:', error);
        toast.error("Failed to fetch API findings");
        throw error;
      }

      return data || [];
    },
    enabled: !!session?.user?.id
  });

  useEffect(() => {
    const channel = supabase
      .channel('api-findings-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'github_api_findings' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['api-findings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const owners = [...new Set(findings.map(f => f.repository_owner || '_unknown'))].filter(Boolean);

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = !searchTerm || 
      finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwner = selectedOwner === "_all" || 
      (selectedOwner === "_unknown" && !finding.repository_owner) ||
      finding.repository_owner === selectedOwner;

    return matchesSearch && matchesOwner;
  });

  const totalPages = Math.ceil(filteredFindings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFindings = filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAll = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('github_api_findings')
        .delete()
        .eq('user_id', session.user.id);

      if (error) throw error;
      toast.success('All findings deleted successfully');
      setCurrentPage(1);
    } catch (error) {
      console.error('Error deleting findings:', error);
      toast.error('Failed to delete findings');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">API Findings</h2>
            <p className="text-muted-foreground">
              View and analyze API endpoints discovered in GitHub repositories
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleDeleteAll}
            disabled={isDeleting || findings.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete All
          </Button>
        </div>

        <FindingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedOwner={selectedOwner}
          onOwnerChange={setSelectedOwner}
          owners={owners}
        />

        {filteredFindings.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No API findings match your search criteria
          </div>
        ) : (
          <>
            <FindingsTable 
              findings={paginatedFindings}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />

            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index + 1}>
                      <PaginationLink
                        onClick={() => handlePageChange(index + 1)}
                        isActive={currentPage === index + 1}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </Card>
  );
};