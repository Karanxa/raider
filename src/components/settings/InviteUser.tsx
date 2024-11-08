import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const InviteUser = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInviteUser = async () => {
    if (!newUserEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        'https://facextdabmrqllgdzkms.supabase.co/functions/v1/invite-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ email: newUserEmail }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite user');
      }

      toast.success("User invited successfully");
      setNewUserEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-2xl font-bold">Invite User</h2>
      <div className="flex gap-4">
        <Input
          placeholder="Enter email to invite"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleInviteUser} disabled={isLoading}>
          {isLoading ? "Inviting..." : "Invite User"}
        </Button>
      </div>
    </div>
  );
};