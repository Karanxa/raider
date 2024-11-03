import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from '@supabase/auth-helpers-react';

const PromptAugmentation = () => {
  const [prompts, setPrompts] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const session = useSession();

  const handleAugment = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    const promptList = prompts.split('\n').map(prompt => prompt.trim()).filter(Boolean);
    
    if (promptList.length === 0 || !keyword) {
      toast.error("Please provide prompts and a keyword.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('augment-prompts', {
        body: { 
          prompts: promptList, 
          keyword,
          userId: session.user.id 
        }
      });

      if (error) throw error;

      setPrompts(""); // Clear the input after successful augmentation
      setKeyword("");
      toast.success("Prompts augmented successfully!");
    } catch (error) {
      console.error("Error augmenting prompts:", error);
      toast.error("Failed to augment prompts.");
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Enter prompts, one per line..."
        value={prompts}
        onChange={(e) => setPrompts(e.target.value)}
        className="min-h-[100px]"
      />
      <Input
        placeholder="Enter keyword for augmentation"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <Button onClick={handleAugment}>Augment Prompts</Button>
    </div>
  );
};

export default PromptAugmentation;