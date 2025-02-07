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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import confetti from 'canvas-confetti';
import { TiptapEditor } from "@/components/ui/tiptap-editor";

export default function ResponseForm({
  responseUrl,
  onSuccess,
  standupId,
  initialResponse,
  mode = "create",
}: {
  responseUrl: string;
  onSuccess?: () => void;
  standupId: number;
  initialResponse?: string;
  mode?: "create" | "edit";
}) {
  const { toast } = useToast();

  const form = useForm<StandupResponse>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      response: initialResponse || "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: StandupResponse) => {
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await apiRequest(method, `/api/responses/${responseUrl}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: mode === "create" 
          ? "Your response has been submitted" 
          : "Your response has been updated",
      });
      // Only show confetti for new submissions
      if (mode === "create") {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
        });
      }
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

  return (
    <div className="space-y-4">
      <TiptapEditor
        value={form.watch("response")}
        onChange={(value) => form.setValue("response", value)}
        placeholder="What are you working on? Are there any blocking issues? Is there anything interesting for the team to know?"
      />

      <Button 
        onClick={form.handleSubmit((data) => submitMutation.mutate(data))}
        className="w-full" 
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {mode === "create" ? "Submit Response" : "Update Response"}
      </Button>
    </div>
  );
}