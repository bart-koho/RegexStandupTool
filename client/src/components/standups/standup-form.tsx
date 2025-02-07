import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStandupSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { TeamMember } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import type { z } from "zod";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type FormData = z.infer<typeof insertStandupSchema>;

export default function StandupForm({
  onSuccess,
}: {
  onSuccess?: (standup: any) => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  const { data: members, isLoading: loadingMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertStandupSchema),
    defaultValues: {
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!sendToAll && selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one team member",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/standups", {
        ...data,
        teamMemberIds: sendToAll ? members?.map(m => m.id) : selectedMembers
      });
      const standup = await res.json();

      toast({
        title: "Success",
        description: "Standup created successfully",
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/standups"] });

      onSuccess?.(standup);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create standup",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingMembers) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter any additional context or instructions for this standup"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendToAll"
              checked={sendToAll}
              onCheckedChange={(checked) => setSendToAll(checked as boolean)}
            />
            <label
              htmlFor="sendToAll"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Send to all team members
            </label>
          </div>

          {!sendToAll && members && members.length > 0 && (
            <Card className="p-4">
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        setSelectedMembers(
                          checked
                            ? [...selectedMembers, member.id]
                            : selectedMembers.filter((id) => id !== member.id)
                        );
                      }}
                    />
                    <label
                      htmlFor={`member-${member.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {member.name}
                      <span className="block text-xs text-muted-foreground mt-1">
                        {member.email}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Standup
        </Button>
      </form>
    </Form>
  );
}