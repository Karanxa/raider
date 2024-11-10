import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'user';

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

        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!roleData) {
          setPermissions(null);
          setLoading(false);
          return;
        }

        // Get allowed categories for the role
        const { data: permissionsData } = await supabase
          .from('role_permissions')
          .select(`
            category_id,
            categories (
              value
            )
          `)
          .eq('role', roleData.role);

        const allowedCategories = permissionsData?.map(p => p.categories.value) || [];

        setPermissions({
          role: roleData.role,
          allowedCategories,
        });
      } catch (error) {
        console.error('Error fetching permissions:', error);
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