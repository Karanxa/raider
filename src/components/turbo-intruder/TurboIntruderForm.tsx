import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicFields } from "./form/BasicFields";
import { RaceConditionFields } from "./form/RaceConditionFields";
import { PayloadFields } from "./form/PayloadFields";
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

  const showRaceOptions = form.watch("raceCondition");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicFields form={form} />
        
        {showRaceOptions && (
          <div className="grid gap-6 sm:grid-cols-2">
            <RaceConditionFields form={form} />
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <PayloadFields form={form} />
        </div>

        <Button type="submit">Generate Script</Button>
      </form>
    </Form>
  );
};

export default TurboIntruderForm;