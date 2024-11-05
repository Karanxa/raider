import { FineTuningForm } from "../FineTuningForm";
import { FineTuningJobs } from "../FineTuningJobs";

export const GenerateScript = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Generate Fine-tuning Script</h3>
        <p className="text-muted-foreground">
          Generate a custom fine-tuning script based on your model and dataset preferences.
        </p>
      </div>
      
      <FineTuningForm />
      <FineTuningJobs />
    </div>
  );
};