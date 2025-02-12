import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type StandupReaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Smile } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

const EMOJI_OPTIONS = ["👍", "❤️", "😄", "🎉", "🚀", "💪", "👏", "🙌"];

type User = {
  id: number;
  username: string;
};

type GroupedReactions = Record<string, User[]>;

export function ResponseReactions({ assignmentId }: { assignmentId: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: reactions } = useQuery<GroupedReactions>({
    queryKey: [`/api/responses/${assignmentId}/reactions`],
  });

  const reactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await apiRequest(
        "POST",
        `/api/responses/${assignmentId}/reactions`,
        { assignmentId, emoji }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/responses/${assignmentId}/reactions`],
      });
    },
  });

  const handleEmojiInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const emoji = e.target.value;
    if (emoji) {
      reactionMutation.mutate(emoji);
      setIsOpen(false);
      e.target.value = ''; // Clear the input
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      {reactions && Object.entries(reactions).map(([emoji, users]) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 data-[active=true]:bg-muted"
                onClick={() => reactionMutation.mutate(emoji)}
                data-active={users.some(u => u.id === queryClient.getQueryData(["/api/user"])?.id)}
              >
                <span className="text-base leading-none">{emoji}</span>
                <span className="text-xs leading-none text-muted-foreground">
                  {users.length}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {users.map(user => user.username).join(", ")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Smile className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {EMOJI_OPTIONS.map(emoji => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-base"
                onClick={() => {
                  reactionMutation.mutate(emoji);
                  setIsOpen(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
          <DropdownMenuSeparator />
          <div className="px-1 py-2">
            <Input
              type="text"
              inputMode="none"
              placeholder="Choose emoji..."
              className="h-8 text-base"
              onChange={handleEmojiInput}
              onClick={(e) => (e.target as HTMLInputElement).focus()}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}