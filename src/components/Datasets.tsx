import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Search, Loader2 } from "lucide-react";
import Papa from 'papaparse';
import JSZip from 'jszip';

interface Dataset {
  id: string;
  name: string;
  downloads: number;
  likes: number;
  description: string;
}

const Datasets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem('huggingface_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const { data: datasets, isLoading, error, refetch } = useQuery({
    queryKey: ["adversarial-datasets", apiKey],
    queryFn: async () => {
      if (!apiKey) {
        throw new Error("Please enter your HuggingFace API key");
      }
      const { data, error } = await supabase.functions.invoke('huggingface-datasets', {
        body: { apiKey }
      });
      if (error) throw error;
      return data.data as Dataset[];
    },
    enabled: !!apiKey,
  });

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('huggingface_api_key', newKey);
  };

  const filteredDatasets = datasets?.filter(dataset => 
    dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportData = async (format: 'csv' | 'txt' | 'zip', dataset: Dataset) => {
    try {
      const dataToExport = {
        id: dataset.id,
        name: dataset.name,
        downloads: dataset.downloads,
        likes: dataset.likes,
        description: dataset.description,
      };

      let content: string | Blob;
      let filename: string;

      switch (format) {
        case 'csv':
          content = Papa.unparse([dataToExport]);
          filename = `${dataset.name}.csv`;
          break;
        case 'txt':
          content = JSON.stringify(dataToExport, null, 2);
          filename = `${dataset.name}.txt`;
          break;
        case 'zip':
          const zip = new JSZip();
          zip.file(`${dataset.name}.json`, JSON.stringify(dataToExport, null, 2));
          const blob = await zip.generateAsync({ type: "blob" });
          content = blob;
          filename = `${dataset.name}.zip`;
          break;
      }

      const link = document.createElement('a');
      if (content instanceof Blob) {
        link.href = URL.createObjectURL(content);
      } else {
        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Dataset exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export dataset: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>HuggingFace API Key</Label>
            <Input
              type="password"
              placeholder="Enter your HuggingFace API key"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally in your browser
            </p>
          </div>
          {apiKey && (
            <Button onClick={() => refetch()}>
              Refresh Datasets
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Adversarial Datasets</h2>
        <div className="relative w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {!apiKey ? (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            Please enter your HuggingFace API key to view datasets
          </div>
        </Card>
      ) : isLoading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading datasets...</span>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-red-500">
            Failed to load datasets. Please check your API key and try again.
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDatasets?.map((dataset) => (
            <Card key={dataset.id} className="p-4 space-y-4">
              <div>
                <h3 className="font-semibold">{dataset.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dataset.description}
                </p>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>👥 {dataset.downloads} downloads</span>
                <span className="mx-2">•</span>
                <span>❤️ {dataset.likes} likes</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportData('csv', dataset)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportData('txt', dataset)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  TXT
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportData('zip', dataset)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  ZIP
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Datasets;