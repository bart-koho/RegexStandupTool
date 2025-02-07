import { useQuery, useMutation } from "@tanstack/react-query";
import { TeamMember, StandupAssignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

export default function TeamMemberList({
  standupId,
  assignments,
}: {
  standupId: number;
  assignments: StandupAssignment[];
}) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/standups/${standupId}/assign`, {
        teamMemberIds: selectedIds,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/standups/${standupId}/assignments`],
      });
      setSelectedIds([]);
      toast({
        title: "Success",
        description: "Team members assigned successfully",
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
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const assignedIds = new Set(assignments.map((a) => a.teamMemberId));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Team Members</CardTitle>
        {selectedIds.length > 0 && (
          <Button
            size="sm"
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Send to Selected
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center space-x-4"
            >
              <Checkbox
                id={`member-${member.id}`}
                checked={selectedIds.includes(member.id)}
                disabled={assignedIds.has(member.id)}
                onCheckedChange={(checked) => {
                  setSelectedIds(
                    checked
                      ? [...selectedIds, member.id]
                      : selectedIds.filter((id) => id !== member.id)
                  );
                }}
              />
              <label
                htmlFor={`member-${member.id}`}
                className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {member.name}
                <span className="block text-xs text-muted-foreground mt-1">
                  {member.email}
                </span>
              </label>
              {assignedIds.has(member.id) && (
                <span className="text-xs text-muted-foreground">
                  Already assigned
                </span>
              )}
            </div>
          ))}

          {(!members || members.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">
              No team members available. Add team members first.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
