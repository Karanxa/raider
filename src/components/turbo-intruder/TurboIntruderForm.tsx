import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicFields } from "./form-fields/BasicFields";
import { RaceConditionFields } from "./form-fields/RaceConditionFields";
import { PayloadFields } from "./form-fields/PayloadFields";
import { TurboIntruderFormValues } from "./types";

interface TurboIntruderFormProps {
  onSubmit: (values: TurboIntruderFormValues) => void;
}

const TurboIntruderForm = ({ onSubmit }: TurboIntruderFormProps) => {
  const form = useForm<TurboIntruderFormValues>({
    defaultValues: {
      engineMode: "clusterbomb",
      requestsPerConnection: 100,
      requestsPerSecond: 100,
      variable1: "§param1§",
      variable2: "",
      payloadType: "wordlist",
      customPayload: "",
      maxRetries: 3,
      raceCondition: false,
      raceTiming: 100,
      raceThreads: 10,
      raceMode: "sync",
      preRaceDelay: 0
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <BasicFields form={form} />
          <RaceConditionFields form={form} />
        </div>
        <PayloadFields form={form} />
        <Button type="submit">Generate Script</Button>
      </form>
    </Form>
  );
};

export default TurboIntruderForm;