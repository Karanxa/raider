import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { TurboIntruderFormValues } from "../types";

interface RaceConditionFieldsProps {
  form: UseFormReturn<TurboIntruderFormValues>;
}

export const RaceConditionFields = ({ form }: RaceConditionFieldsProps) => {
  const showRaceOptions = form.watch("raceCondition");

  return (
    <>
      <FormField
        control={form.control}
        name="raceCondition"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Race Condition Mode</FormLabel>
              <FormDescription>
                Enable race condition testing
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {showRaceOptions && (
        <>
          <FormField
            control={form.control}
            name="raceMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Race Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select race mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sync">Synchronized</SelectItem>
                    <SelectItem value="async">Asynchronous</SelectItem>
                    <SelectItem value="burst">Burst</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How to coordinate race condition requests
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="raceThreads"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Race Threads</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>
                  Number of concurrent threads for racing
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="raceTiming"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Race Timing (ms)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>
                  Timing between race condition requests
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preRaceDelay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pre-Race Delay (ms)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                </FormControl>
                <FormDescription>
                  Delay before starting race condition requests
                </FormDescription>
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
};