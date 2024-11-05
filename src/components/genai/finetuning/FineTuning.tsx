import { FineTuningForm } from "./FineTuningForm";
import { FineTuningJobs } from "./FineTuningJobs";

export const FineTuning = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Model Fine-tuning</h2>
        <p className="text-muted-foreground">
          Fine-tune pre-trained models on your custom dataset using Google Colab's GPU resources.
        </p>
      </div>
      
      <FineTuningForm />
      <FineTuningJobs />
    </div>
  );
};