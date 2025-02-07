import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { responseSchema, type StandupResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function ResponseForm({
  responseUrl,
  onSuccess,
}: {
  responseUrl: string;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StandupResponse>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  const onSubmit = async (data: StandupResponse) => {
    try {
      setIsSubmitting(true);
      await apiRequest("POST", `/api/responses/${responseUrl}`, data);
      toast({
        title: "Success",
        description: "Your response has been submitted",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="response"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Update</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="What are you working on? Are there any blocking issues? Is there anything interesting for the team to know?"
                  className="min-h-[150px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit Response
        </Button>
      </form>
    </Form>
  );
}