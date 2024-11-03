import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from '@supabase/auth-helpers-react';
import Papa from 'papaparse';
import { Download, Upload } from 'lucide-react';
import { Card } from "@/components/ui/card";

const PromptAugmentation = () => {
  const [prompts, setPrompts] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [augmentedPrompt, setAugmentedPrompt] = useState<string>("");
  const [augmentedPrompts, setAugmentedPrompts] = useState<Array<{ original: string; augmented: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCsvMode, setIsCsvMode] = useState(false);
  const session = useSession();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    Papa.parse(file, {
      complete: (results) => {
        const promptList = results.data
          .map((row: any) => row.prompts)
          .filter((prompt: any) => prompt && typeof prompt === "string");

        if (promptList.length === 0) {
          toast.error("No valid prompts found in CSV file");
          setIsProcessing(false);
          return;
        }

        setPrompts(promptList.join('\n'));
        setIsCsvMode(true);
        setIsProcessing(false);
        toast.success(`Loaded ${promptList.length} prompts from CSV`);
      },
      header: true,
      error: (error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
        setIsProcessing(false);
      },
    });
  };

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

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('augment-prompts', {
        body: { 
          prompts: promptList, 
          keyword,
          userId: session.user.id 
        }
      });

      if (error) throw error;

      if (isCsvMode) {
        setAugmentedPrompts(promptList.map((original, index) => ({
          original,
          augmented: data.augmentedPrompts[index]
        })));
      } else {
        setAugmentedPrompt(data.augmentedPrompts[0]);
      }

      toast.success("Prompts augmented successfully!");
    } catch (error) {
      console.error("Error augmenting prompts:", error);
      toast.error("Failed to augment prompts.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCsv = () => {
    const csvData = augmentedPrompts.map(({ original, augmented }) => ({
      original_prompt: original,
      augmented_prompt: augmented
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `augmented_prompts_${keyword}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("csv-upload")?.click()}
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
          {isCsvMode && augmentedPrompts.length > 0 && (
            <Button onClick={exportToCsv} disabled={isProcessing}>
              <Download className="w-4 h-4 mr-2" />
              Export Augmented Prompts
            </Button>
          )}
        </div>
        
        <Textarea
          placeholder="Enter prompts, one per line..."
          value={prompts}
          onChange={(e) => {
            setPrompts(e.target.value);
            setIsCsvMode(e.target.value.includes('\n'));
          }}
          className="min-h-[100px]"
        />
        
        <Input
          placeholder="Enter keyword for augmentation"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        
        <Button 
          onClick={handleAugment} 
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Augment Prompts"}
        </Button>
      </div>

      {!isCsvMode && augmentedPrompt && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Augmented Prompt:</h3>
          <p className="text-muted-foreground">{augmentedPrompt}</p>
        </Card>
      )}

      {isCsvMode && augmentedPrompts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Preview of Augmented Prompts:</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {augmentedPrompts.slice(0, 5).map((item, index) => (
              <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                <p className="text-sm text-muted-foreground">Original: {item.original}</p>
                <p className="text-sm">Augmented: {item.augmented}</p>
              </div>
            ))}
            {augmentedPrompts.length > 5 && (
              <p className="text-sm text-muted-foreground">
                ... and {augmentedPrompts.length - 5} more prompts. Export to CSV to see all.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PromptAugmentation;