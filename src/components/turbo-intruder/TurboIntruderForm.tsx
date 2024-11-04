import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export type TurboIntruderFormValues = {
  engineMode: string;
  requestsPerConnection: number;
  requestsPerSecond: number;
  variable1: string;
  variable2: string;
  payloadType: string;
  customPayload: string;
  maxRetries: number;
  raceCondition: boolean;
  raceTiming: number;
  raceThreads: number;
  raceMode: string;
  preRaceDelay: number;
};

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
        </div>

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

        <Button type="submit">Generate Script</Button>
      </form>
    </Form>
  );
};

export default TurboIntruderForm;
