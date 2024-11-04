import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from '@supabase/auth-helpers-react';
import Papa from 'papaparse';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileUpload } from './prompt-augmentation/FileUpload';
import { ResultsPreview } from './prompt-augmentation/ResultsPreview';
import { useApiKeys } from "@/hooks/useApiKeys";

const PromptAugmentation = () => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptText, setPromptText] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [augmentedPrompt, setAugmentedPrompt] = useState<string>("");
  const [augmentedPrompts, setAugmentedPrompts] = useState<Array<{ original: string; augmented: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCsvMode, setIsCsvMode] = useState(false);
  const session = useSession();
  const { getApiKey } = useApiKeys();

  const handleAugment = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    if (!provider) {
      toast.error("Please select an AI provider");
      return;
    }

    const storedApiKey = getApiKey(provider);
    if (!storedApiKey) {
      toast.error(`Please add your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key in Settings`);
      return;
    }

    // For CSV mode, we use the prompts array directly
    // For single prompt mode, we use the single prompt
    const promptList = isCsvMode 
      ? prompts
      : [promptText.trim()];
    
    if (promptList.length === 0 || !keyword) {
      toast.error("Please provide prompts and a keyword");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-augment-prompts', {
        body: { 
          prompts: promptList,
          keyword,
          provider,
          apiKey: storedApiKey,
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
      toast.error("Failed to augment prompts");
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

  const handleFileUpload = (promptList: string[]) => {
    setPrompts(promptList);
    setIsCsvMode(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select AI Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FileUpload 
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
          
          <Textarea
            placeholder="Enter prompts, one per line..."
            value={isCsvMode ? prompts.join('\n') : promptText}
            onChange={(e) => {
              if (isCsvMode) {
                setPrompts(e.target.value.split('\n'));
              } else {
                setPromptText(e.target.value);
              }
            }}
            className="min-h-[100px]"
          />
          
          <Input
            placeholder="Enter keyword for augmentation (e.g., ecommerce, banking)"
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
      </Card>

      {!isCsvMode && augmentedPrompt && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Augmented Prompt:</h3>
          <p className="text-muted-foreground">{augmentedPrompt}</p>
        </Card>
      )}

      {isCsvMode && (
        <ResultsPreview 
          augmentedPrompts={augmentedPrompts}
          onExport={exportToCsv}
        />
      )}
    </div>
  );
};

export default PromptAugmentation;