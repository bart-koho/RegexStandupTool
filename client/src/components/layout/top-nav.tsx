import { Link, useLocation } from "wouter";
import { Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function TopNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location === path;

  return (
    <nav className="border-b bg-background">
      <div className="container max-w-4xl mx-auto py-4">
        <div className="flex justify-end gap-4">
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
        </div>
      </div>
    </nav>
  );
}