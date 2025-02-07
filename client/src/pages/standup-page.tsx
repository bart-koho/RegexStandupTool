import { useQuery } from "@tanstack/react-query";
import { Standup, StandupAssignment, StandupResponse, TeamMember } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Container from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";
import ResponseForm from "@/components/standups/response-form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import InviteMembersDialog from "@/components/standups/invite-members-dialog";

export default function StandupPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();

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

  // For non-admin users, get their own team member record to check if they can submit
  const { data: userTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
    enabled: !!user && user.role !== 'admin',
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
  const userTeamMember = userTeamMembers?.[0];
  const userAssignment = userTeamMember 
    ? assignments.find(a => a.teamMemberId === userTeamMember.id)
    : undefined;

  // Create a map of team member IDs to team member objects for easy lookup
  const teamMemberMap = new Map(teamMembers.map(member => [member.id, member]));

  // Sort assignments to put user's assignment first
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.teamMemberId === userTeamMember?.id) return -1;
    if (b.teamMemberId === userTeamMember?.id) return 1;
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

            return (
              <div
                key={assignment.id}
                className="p-4 border rounded-lg space-y-2 bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {teamMember.name}
                    {userTeamMember?.id === teamMember.id && (
                      <span className="ml-2 text-sm text-muted-foreground">(You)</span>
                    )}
                  </div>
                  <Badge
                    variant={assignment.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      assignment.status === "completed" && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                      assignment.status === "pending" && "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                    )}
                  >
                    {assignment.status === "completed" ? "Responded" : "Pending"}
                  </Badge>
                </div>
                {assignment.status === "completed" && assignment.response && (
                  <div className="text-sm mt-2 text-muted-foreground">
                    {(assignment.response as StandupResponse).response}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Container>
  );
}