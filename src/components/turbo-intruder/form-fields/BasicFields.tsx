import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TurboIntruderFormValues } from "../types";

interface BasicFieldsProps {
  form: UseFormReturn<TurboIntruderFormValues>;
}

export const BasicFields = ({ form }: BasicFieldsProps) => {
  return (
    <>
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

      <FormField
        control={form.control}
        name="maxRetries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Retries</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
            </FormControl>
            <FormDescription>
              Maximum retry attempts for failed requests
            </FormDescription>
          </FormItem>
        )}
      />
    </>
  );
};