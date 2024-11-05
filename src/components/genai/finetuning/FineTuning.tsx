import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateScript } from "./generate-script/GenerateScript";
import { PerformFineTuning } from "./perform-finetuning/PerformFineTuning";
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const FineTuning = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Model Fine-tuning</h2>
          <p className="text-muted-foreground">
            Fine-tune pre-trained models on your custom dataset using Google Colab's GPU resources.
          </p>
        </div>
        
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generate Script</TabsTrigger>
            <TabsTrigger value="perform">Perform Fine-tuning</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <GenerateScript />
          </TabsContent>

          <TabsContent value="perform" className="mt-6">
            <PerformFineTuning />
          </TabsContent>
        </Tabs>
      </div>
    </GoogleOAuthProvider>
  );
};