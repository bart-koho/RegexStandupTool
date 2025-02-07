import { Link, useLocation } from "wouter";
import { Home, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
      <div className="flex items-center justify-around p-4">
        <Link href="/">
          <a
            className={cn(
              "flex flex-col items-center gap-1 text-sm",
              isActive("/") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </a>
        </Link>
        <Link href="/team">
          <a
            className={cn(
              "flex flex-col items-center gap-1 text-sm",
              isActive("/team") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Users className="h-5 w-5" />
            <span>Team</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}
