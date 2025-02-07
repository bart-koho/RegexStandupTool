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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import Container from "@/components/layout/container";
import { useAuth } from "@/hooks/use-auth";
import StandupForm from "@/components/standups/standup-form";
import { useState } from "react";

interface StandupResponse {
  items: Standup[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data: standupData, isLoading } = useQuery<StandupResponse>({
    queryKey: ["/api/standups", page],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const standups = standupData?.items || [];
  const pagination = standupData?.pagination;

  return (
    <Container className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Standups</h1>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Standup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Standup</DialogTitle>
              </DialogHeader>
              <StandupForm 
                onSuccess={(standup) => {
                  setDialogOpen(false);
                  setLocation(`/standup/${standup.id}`);
                }}
              />
            </DialogContent>
          </Dialog>
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
                {standup.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {standup.description}
                  </p>
                )}
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}