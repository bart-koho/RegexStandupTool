import { Link, useLocation } from "wouter";
import { Home, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
      <div className="container max-w-md mx-auto">
        <div className="grid grid-cols-2 gap-4 p-4">
          <Link href="/">
            <a
              className={cn(
                "flex flex-col items-center gap-1 text-sm rounded-lg p-3 hover:bg-accent",
                isActive("/") ? "text-primary bg-accent" : "text-muted-foreground"
              )}
            >
              <Home className="h-5 w-5" />
              <span>Standups</span>
            </a>
          </Link>
          <Link href="/team">
            <a
              className={cn(
                "flex flex-col items-center gap-1 text-sm rounded-lg p-3 hover:bg-accent",
                isActive("/team") ? "text-primary bg-accent" : "text-muted-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              <span>Team</span>
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}