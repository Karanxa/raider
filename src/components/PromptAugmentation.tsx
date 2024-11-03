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

const PromptAugmentation = () => {
  const [prompts, setPrompts] = useState<string>("");
  const [keyword, setKeyword] = useState<string>("");
  const [provider, setProvider] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [augmentedPrompt, setAugmentedPrompt] = useState<string>("");
  const [augmentedPrompts, setAugmentedPrompts] = useState<Array<{ original: string; augmented: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCsvMode, setIsCsvMode] = useState(false);
  const session = useSession();

  const handleAugment = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to use this feature");
      return;
    }

    if (!provider) {
      toast.error("Please select an AI provider");
      return;
    }

    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }

    const promptList = isCsvMode 
      ? prompts.split('\n').map(prompt => prompt.trim()).filter(Boolean)
      : [prompts.trim()];
    
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
          apiKey,
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
    setPrompts(promptList.join('\n'));
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

          {provider && (
            <div className="space-y-2">
              <Label>{provider === 'openai' ? 'OpenAI' : 'Gemini'} API Key</Label>
              <Input
                type="password"
                placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Your API key is used only for this request and is not stored
              </p>
            </div>
          )}

          <FileUpload 
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
          />
          
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