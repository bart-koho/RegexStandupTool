import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Standup, StandupAssignment, StandupResponse, TeamMember } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import Container from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";
import ResponseForm from "@/components/standups/response-form";
import { ResponseReactions } from "@/components/standups/response-reactions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import InviteMembersDialog from "@/components/standups/invite-members-dialog";
import { ResponseComments } from "@/components/standups/response-comments";

export default function StandupPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [editingResponseId, setEditingResponseId] = useState<number | null>(null);

  const { data: standup, isLoading: loadingStandup } = useQuery<Standup>({
    queryKey: [`/api/standups/${params.id}`],
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery<
    StandupAssignment[]
  >({
    queryKey: [`/api/standups/${params.id}/assignments`],
  });

  // Get all team members for this standup
  const { data: teamMembers, isLoading: loadingTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members", { standupId: params.id }],
  });

  // Get current user's team member record
  const { data: userTeamMember } = useQuery<TeamMember>({
    queryKey: ["/api/team-members"],
    select: (members: TeamMember[]) =>
      members.find(member => member.email === user?.email),
    enabled: !!user,
  });

  if (loadingStandup || loadingAssignments || loadingTeamMembers) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!standup || !assignments || !teamMembers) return null;

  // Find the current user's assignment if they have one
  const userAssignment = userTeamMember
    ? assignments.find(a => a.teamMemberId === userTeamMember.id)
    : undefined;

  // Create a map of team member IDs to team member objects for easy lookup
  const teamMemberMap = new Map(teamMembers.map(member => [member.id, member]));

  // Sort assignments to put user's assignment first, then completed responses, then pending ones
  const sortedAssignments = [...assignments].sort((a, b) => {
    // First priority: user's own assignment goes first
    if (a.teamMemberId === userTeamMember?.id) return -1;
    if (b.teamMemberId === userTeamMember?.id) return 1;

    // Second priority: completed before pending
    if (a.status === "completed" && b.status === "pending") return -1;
    if (a.status === "pending" && b.status === "completed") return 1;

    // If same status, maintain original order
    return 0;
  });

  return (
    <Container className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <a className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Standup {standup.identifier}
            </h1>
            {standup.description && (
              <p className="text-muted-foreground">
                {standup.description}
              </p>
            )}
          </div>
        </div>
        {user?.role === 'admin' && (
          <InviteMembersDialog
            standupId={standup.id}
            currentAssignments={assignments}
          />
        )}
      </div>

      <div className="space-y-4">
        {userAssignment?.status === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Update</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseForm
                responseUrl={userAssignment.responseUrl}
                standupId={standup.id}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {sortedAssignments.map((assignment) => {
            const teamMember = teamMemberMap.get(assignment.teamMemberId);
            if (!teamMember) return null;

            const isEditing = editingResponseId === assignment.id;
            const isOwnResponse = userTeamMember?.id === teamMember.id;
            const response = assignment.response as StandupResponse;

            return (
              <div
                key={assignment.id}
                className="p-4 border rounded-lg space-y-2 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {teamMember.name}
                    {isOwnResponse && (
                      <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={assignment.status === "completed" ? "default" : "secondary"}
                      className={cn(
                        assignment.status === "completed" && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                        assignment.status === "pending" && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                      )}
                    >
                      {assignment.status === "completed" ? "Responded" : "Pending"}
                    </Badge>
                    {isOwnResponse && assignment.status === "completed" && !isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingResponseId(assignment.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {assignment.status === "completed" && (
                  <>
                    {isEditing ? (
                      <div className="mt-4">
                        <ResponseForm
                          responseUrl={assignment.responseUrl}
                          standupId={standup.id}
                          initialResponse={response.response}
                          mode="edit"
                          onSuccess={() => setEditingResponseId(null)}
                        />
                      </div>
                    ) : (
                      <>
                        <div
                          className="text-sm mt-2 text-muted-foreground prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: response.response }}
                        />
                        <div className="flex items-start gap-4 mt-2">
                          <div className="flex-1">
                            <ResponseComments assignmentId={assignment.id} />
                          </div>
                          <ResponseReactions assignmentId={assignment.id} />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {(!assignments || assignments.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">
              No responses yet.
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}