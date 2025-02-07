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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import confetti from 'canvas-confetti';

export default function ResponseForm({
  responseUrl,
  onSuccess,
  standupId,
}: {
  responseUrl: string;
  onSuccess?: () => void;
  standupId: number;
}) {
  const { toast } = useToast();

  const form = useForm<StandupResponse>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: StandupResponse) => {
      const res = await apiRequest("POST", `/api/responses/${responseUrl}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your response has been submitted",
      });
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
      });
      // Invalidate relevant queries to update the UI
      queryClient.invalidateQueries({ queryKey: [`/api/standups/${standupId}/assignments`] });
      onSuccess?.();
      // Reset form
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StandupResponse) => {
    submitMutation.mutate(data);
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

        <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
          {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Submit Response
        </Button>
      </form>
    </Form>
  );
}