import { useQuery, useMutation } from "@tanstack/react-query";
import { TeamMember, StandupAssignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const assignmentsByMemberId = new Map(assignments.map(a => [a.teamMemberId, a]));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Selected
              </Button>
            </div>
          )}

          {members?.map((member) => {
            const assignment = assignmentsByMemberId.get(member.id);
            const status = assignment?.status || "not-assigned";

            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
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
                  <div>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor={`member-${member.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {member.name}
                      </label>
                      {status !== "not-assigned" && (
                        <Badge
                          variant={status === "completed" ? "default" : "secondary"}
                          className={cn(
                            status === "completed" && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                            status === "pending" && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                          )}
                        >
                          {status === "completed" ? "Responded" : "Pending"}
                        </Badge>
                      )}
                    </div>
                    <span className="block text-xs text-muted-foreground mt-1">
                      {member.email}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

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