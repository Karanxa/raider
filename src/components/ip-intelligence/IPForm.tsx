import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  ipAddress: z.string().min(1, "IP address is required").regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, "Invalid IP address format"),
});

export type FormSchema = z.infer<typeof formSchema>;

interface IPFormProps {
  onSubmit: (data: FormSchema) => Promise<void>;
  scanning: boolean;
}

export const IPForm = ({ onSubmit, scanning }: IPFormProps) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="ipAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter IP address (e.g., 8.8.8.8)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={scanning}>
          {scanning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Scan IP
        </Button>
      </form>
    </Form>
  );
};