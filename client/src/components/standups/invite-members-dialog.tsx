import { useState } from "react";
import { TeamMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, UserPlus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function InviteMembersDialog({ 
  standupId,
  currentAssignments,
}: { 
  standupId: number;
  currentAssignments: { teamMemberId: number }[];
}) {
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get all team members
  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/standups/${standupId}/assign`, {
        teamMemberIds: selectedMembers,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/standups/${standupId}/assignments`] });
      setDialogOpen(false);
      setSelectedMembers([]);
      toast({
        title: "Success",
        description: "Team members have been invited to the standup",
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

  // Get the set of already assigned member IDs
  const assignedMemberIds = new Set(currentAssignments.map(a => a.teamMemberId));

  // Filter out already assigned members
  const availableMembers = members?.filter(member => !assignedMemberIds.has(member.id)) || [];

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {selectedMembers.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invites
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          ) : availableMembers.length > 0 ? (
            <Card className="p-4">
              <div className="space-y-4">
                {availableMembers.map((member) => (
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
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No team members available to invite.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
