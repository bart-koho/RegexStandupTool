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
      accomplishments: "",
      blockers: "",
      plans: "",
      help: "",
      notes: "",
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
          name="accomplishments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What did you accomplish since the last standup?</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Are you facing any blockers or challenges?</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plans"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What are your plans for today?</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="help"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you need any help or support?</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional notes (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Submit Response
        </Button>
      </form>
    </Form>
  );
}
