import { ModelSelect } from "./ModelSelect";
import { DatasetInput } from "./DatasetInput";
import { HyperParameters } from "./HyperParameters";

interface FormFieldsProps {
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  datasetType: string;
  setDatasetType: (value: string) => void;
  taskType: string;
  setTaskType: (value: string) => void;
  setSelectedFile: (file: File | null) => void;
  hyperparameters: any;
  setHyperparameters: (value: any) => void;
}

export const FormFields = ({
  selectedModel,
  setSelectedModel,
  datasetType,
  setDatasetType,
  taskType,
  setTaskType,
  setSelectedFile,
  hyperparameters,
  setHyperparameters,
}: FormFieldsProps) => {
  return (
    <div className="space-y-6">
      <ModelSelect
        modelName={selectedModel}
        setModelName={setSelectedModel}
        datasetType={datasetType}
        setDatasetType={setDatasetType}
        taskType={taskType}
        setTaskType={setTaskType}
      />

      <DatasetInput onFileSelect={setSelectedFile} />

      <HyperParameters
        hyperparameters={hyperparameters}
        setHyperparameters={setHyperparameters}
      />
    </div>
  );
};