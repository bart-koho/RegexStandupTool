import { Link, useLocation } from "wouter";
import { Users, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function TopNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location === path;

  return (
    <nav className="border-b bg-background">
      <div className="container max-w-4xl mx-auto py-4">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Link href="/">
              <Button 
                variant={isActive("/") ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Standups
              </Button>
            </Link>
            {user.role === 'admin' && (
              <Link href="/team">
                <Button 
                  variant={isActive("/team") ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Team Management
                </Button>
              </Link>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}