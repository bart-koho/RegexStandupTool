import { useQuery } from "@tanstack/react-query";
import { Standup } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Container from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: standups, isLoading } = useQuery<Standup[]>({
    queryKey: ["/api/standups"],
  });

  const createStandup = async () => {
    try {
      const res = await apiRequest("POST", "/api/standups");
      const standup = await res.json();
      setLocation(`/standup/${standup.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create standup",
        variant: "destructive",
      });
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Standups</h1>
        {user?.role === 'admin' && (
          <Button onClick={createStandup}>
            <Plus className="h-4 w-4 mr-2" />
            New Standup
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {standups?.map((standup) => (
          <Link key={standup.id} href={`/standup/${standup.id}`}>
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {standup.identifier}
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Created on{" "}
                  {new Date(standup.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!standups || standups.length === 0) && (
          <Card>
            <CardHeader>
              <CardTitle>No standups yet</CardTitle>
              <CardDescription>
                {user?.role === 'admin' 
                  ? 'Create your first standup to get started'
                  : 'No standups have been created yet'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </Container>
  );
}