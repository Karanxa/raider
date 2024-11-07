import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserRole = 'superadmin' | 'admin' | 'user';

interface UserPermissions {
  role: UserRole;
  allowedCategories: string[];
}

export const useRBAC = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setPermissions(null);
          setLoading(false);
          return;
        }

        // Get user role with error handling
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          toast.error('Failed to fetch user permissions');
          setPermissions(null);
          setLoading(false);
          return;
        }

        if (!roleData) {
          // If no role is found, set default role
          setPermissions({
            role: 'user',
            allowedCategories: []
          });
          setLoading(false);
          return;
        }

        // Get allowed categories for the role with error handling
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('role_permissions')
          .select(`
            category_id,
            categories (
              value
            )
          `)
          .eq('role', roleData.role);

        if (permissionsError) {
          console.error('Error fetching permissions:', permissionsError);
          toast.error('Failed to fetch category permissions');
          setPermissions({
            role: roleData.role,
            allowedCategories: []
          });
          setLoading(false);
          return;
        }

        const allowedCategories = permissionsData?.map(p => p.categories?.value) || [];

        setPermissions({
          role: roleData.role,
          allowedCategories,
        });
      } catch (error) {
        console.error('Error fetching permissions:', error);
        toast.error('Failed to fetch user permissions');
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, []);

  const hasAccess = (category: string) => {
    if (!permissions) return false;
    return permissions.allowedCategories.includes(category);
  };

  return {
    role: permissions?.role,
    loading,
    hasAccess,
  };
};