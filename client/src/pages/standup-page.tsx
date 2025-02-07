import { useQuery } from "@tanstack/react-query";
import { Standup, StandupAssignment, StandupResponse, TeamMember } from "@shared/schema";
import TeamMemberList from "@/components/standups/team-member-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Container from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";
import ResponseForm from "@/components/standups/response-form";

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

  // Get the user's team member record
  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
    enabled: !!user && user.role !== 'admin', // Only fetch for non-admin users
  });

  if (loadingStandup || loadingAssignments) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!standup) return null;

  // Find the current user's assignment if they have one
  const userTeamMember = teamMembers?.[0]; // Non-admin users only have their own record
  const userAssignment = assignments?.find(a => a.teamMemberId === userTeamMember?.id);
  const canSubmitResponse = userAssignment && userAssignment.status === "pending";

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
      </div>

      <div className="grid gap-6">
        {canSubmitResponse && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Update</CardTitle>
              <CardDescription>
                Share your daily progress with the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponseForm 
                responseUrl={userAssignment?.responseUrl}
                onSuccess={() => window.location.reload()}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Team members assigned to this standup and their response status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberList standupId={standup.id} assignments={assignments || []} />
          </CardContent>
        </Card>

        {assignments && assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="font-medium">
                    Status: {assignment.status}
                  </div>
                  {assignment.response && (
                    <div className="text-sm mt-2">
                      {(assignment.response as StandupResponse).response}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}