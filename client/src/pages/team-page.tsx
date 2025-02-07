import { useQuery, useMutation } from "@tanstack/react-query";
import { TeamMember, insertTeamMemberSchema, type InsertTeamMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, User2, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Container from "@/components/layout/container";
import type { z } from "zod";

type FormData = z.infer<typeof insertTeamMemberSchema>;

export default function TeamPage() {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(insertTeamMemberSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/team-members", data);
      return res.json() as Promise<TeamMember>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      form.reset();
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Container className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  Add Member
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {members?.map((member) => (
          <div
            key={member.id}
            className="flex items-center space-x-4 p-4 border rounded-lg"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
          </div>
        ))}

        {(!members || members.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No team members yet. Add your first team member to get started.
          </div>
        )}
      </div>
    </Container>
  );
}