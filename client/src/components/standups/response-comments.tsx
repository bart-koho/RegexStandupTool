import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InsertComment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Comment = {
  comment: {
    id: number;
    content: string;
    createdAt: string;
  };
  user: {
    id: number;
    username: string;
  };
};

export function ResponseComments({ assignmentId }: { assignmentId: number }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/responses/${assignmentId}/comments`],
    enabled: isOpen,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest(
        "POST",
        `/api/responses/${assignmentId}/comments`,
        { assignmentId, content }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/responses/${assignmentId}/comments`],
      });
      setContent("");
      toast({
        title: "Success",
        description: "Comment added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      commentMutation.mutate(content);
    }
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs text-muted-foreground">{comments.length || ""}</span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 h-8 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={!content.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Send
              </Button>
            </form>

            <div className="space-y-3">
              {comments.map(({ comment, user }) => (
                <div key={comment.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(comment.createdAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}