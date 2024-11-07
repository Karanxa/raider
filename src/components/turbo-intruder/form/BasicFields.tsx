import { FormField } from "@/components/ui/form";
import { FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { TurboIntruderFormValues } from "../types";

interface BasicFieldsProps {
  form: UseFormReturn<TurboIntruderFormValues>;
}

export const BasicFields = ({ form }: BasicFieldsProps) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="engineMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Engine Mode</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select engine mode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="clusterbomb">Cluster Bomb</SelectItem>
                <SelectItem value="sniper">Sniper</SelectItem>
                <SelectItem value="pitchfork">Pitchfork</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Turbo Intruder attack mode
            </FormDescription>
          </FormItem>
        )}
      />

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

      <FormField
        control={form.control}
        name="requestsPerConnection"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Requests Per Connection</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
            </FormControl>
            <FormDescription>
              Number of requests per connection (affects performance)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="requestsPerSecond"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Requests Per Second</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
            </FormControl>
            <FormDescription>
              Target requests per second
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
};