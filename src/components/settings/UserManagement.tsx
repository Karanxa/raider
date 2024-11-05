import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRBAC, UserRole } from "@/hooks/useRBAC";

export const UserManagement = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const { role } = useRBAC();
  
  const { data: users, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: users } = await supabase
        .from('user_roles')
        .select(`
          id,
          role,
          profiles:profiles(email)
        `);
      return users;
    },
  });

  const handleInviteUser = async () => {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(newUserEmail);
      if (error) throw error;
      toast.success("User invited successfully");
      setNewUserEmail("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      
      if (error) throw error;
      toast.success("User role updated successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
    }
  };

  if (role !== 'superadmin') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Enter email to invite"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={handleInviteUser}>Invite User</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.profiles?.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value: UserRole) => updateUserRole(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};