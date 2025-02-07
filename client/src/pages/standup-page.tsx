import { useQuery } from "@tanstack/react-query";
import { Standup, StandupAssignment, StandupResponse } from "@shared/schema";
import TeamMemberList from "@/components/standups/team-member-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function StandupPage({ params }: { params: { id: string } }) {
  const { data: standup, isLoading: loadingStandup } = useQuery<Standup>({
    queryKey: [`/api/standups/${params.id}`],
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery<
    StandupAssignment[]
  >({
    queryKey: [`/api/standups/${params.id}/assignments`],
  });

  if (loadingStandup || loadingAssignments) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!standup) return null;

  return (
    <div className="container max-w-4xl py-6 space-y-6 mb-16">
      <div className="flex items-center gap-4">
        <Link href="/">
          <a className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </a>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Standup {standup.identifier}
        </h1>
      </div>

      <div className="grid gap-6">
        <TeamMemberList standupId={standup.id} assignments={assignments || []} />

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
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Accomplishments:</strong>{" "}
                        {(assignment.response as StandupResponse).accomplishments}
                      </p>
                      <p>
                        <strong>Blockers:</strong> {(assignment.response as StandupResponse).blockers}
                      </p>
                      <p>
                        <strong>Plans:</strong> {(assignment.response as StandupResponse).plans}
                      </p>
                      {(assignment.response as StandupResponse).help && (
                        <p>
                          <strong>Help Needed:</strong>{" "}
                          {(assignment.response as StandupResponse).help}
                        </p>
                      )}
                      {(assignment.response as StandupResponse).notes && (
                        <p>
                          <strong>Additional Notes:</strong>{" "}
                          {(assignment.response as StandupResponse).notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}