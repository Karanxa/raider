import { FormField } from "@/components/ui/form";
import { FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { TurboIntruderFormValues } from "../types";

interface PayloadFieldsProps {
  form: UseFormReturn<TurboIntruderFormValues>;
}

export const PayloadFields = ({ form }: PayloadFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="variable1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variable 1</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., §password§" />
            </FormControl>
            <FormDescription>
              First variable to replace (marked with §)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="variable2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Variable 2 (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., §token§" />
            </FormControl>
            <FormDescription>
              Second variable for multi-parameter attacks
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payloadType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payload Source</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select payload source" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="wordlist">Clipboard Wordlist</SelectItem>
                <SelectItem value="custom">Custom Payload List</SelectItem>
                <SelectItem value="numbers">Number Range</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Source of payload values
            </FormDescription>
          </FormItem>
        )}
      />

      {form.watch("payloadType") === "custom" && (
        <FormField
          control={form.control}
          name="customPayload"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Payload List</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter payloads (one per line)"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                Enter your custom payloads, one per line
              </FormDescription>
            </FormItem>
          )}
        />
      )}
    </>
  );
};