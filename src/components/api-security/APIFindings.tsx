import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";
import { Card } from "@/components/ui/card";
import { APIFindingsFilters } from "./APIFindingsFilters";
import { APIFindingsTable } from "./APIFindingsTable";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['api-findings', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('github_api_findings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  const owners = [...new Set(findings.map(f => f.repository_owner))].filter(Boolean);

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = !searchTerm || 
      finding.repository_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.api_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwner = !selectedOwner || finding.repository_owner === selectedOwner;

    return matchesSearch && matchesOwner;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredFindings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFindings = filteredFindings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Findings</h2>
          <p className="text-muted-foreground">
            View and analyze API endpoints discovered in GitHub repositories
          </p>
        </div>

        <APIFindingsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedOwner={selectedOwner}
          onOwnerChange={setSelectedOwner}
          owners={owners}
        />

        <APIFindingsTable findings={paginatedFindings} />

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
      </div>
    </Card>
  );
};