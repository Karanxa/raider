import { useState } from "react";
import { useForm } from "react-hook-form";
import { Terminal, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type FormValues = {
  attackType: string;
  requestsPerSecond: number;
  payloadType: string;
  customPayload: string;
  targetParameter: string;
  concurrent: number;
};

const TurboIntruderGenerator = () => {
  const [generatedScript, setGeneratedScript] = useState<string>("");
  
  const form = useForm<FormValues>({
    defaultValues: {
      attackType: "bruteforce",
      requestsPerSecond: 100,
      payloadType: "wordlist",
      customPayload: "",
      targetParameter: "",
      concurrent: 10
    }
  });

  const generateScript = (values: FormValues) => {
    const script = `def queueRequests(target, wordlists):
    engine = RequestEngine(
        endpoint=target.endpoint,
        concurrentConnections=${values.concurrent},
        requestsPerConnection=${Math.floor(values.requestsPerSecond / values.concurrent)},
        pipeline=False
    )
    
    ${values.payloadType === "wordlist" ? 
      `wordlist = wordlists.clipboard if wordlists.clipboard else wordlists.default` :
      `custom_payloads = """${values.customPayload}""".splitlines()`
    }
    
    for word in ${values.payloadType === "wordlist" ? "wordlist" : "custom_payloads"}:
        engine.queue(target.req, word.rstrip(), gate='${values.targetParameter}')

def handleResponse(req, interesting):
    if interesting:
        table.add(req)`;

    setGeneratedScript(script);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      toast.success("Script copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy script");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Terminal className="h-5 w-5" />
        Generate Turbo Intruder Script
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(generateScript)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="attackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attack Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attack type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bruteforce">Brute Force</SelectItem>
                      <SelectItem value="ratelimited">Rate Limited</SelectItem>
                      <SelectItem value="recursive">Recursive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of attack you want to perform
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
                    Number of requests to send per second
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concurrent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concurrent Connections</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                  </FormControl>
                  <FormDescription>
                    Number of concurrent connections to use
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetParameter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Parameter</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., §password§" />
                  </FormControl>
                  <FormDescription>
                    Parameter to replace in the request (marked with §)
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payloadType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payload Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payload type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="wordlist">Use Clipboard Wordlist</SelectItem>
                      <SelectItem value="custom">Custom Payload List</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose between clipboard wordlist or custom payload
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

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

      {generatedScript && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold">Generated Script</div>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{generatedScript}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TurboIntruderGenerator;