import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar, UserPlus } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

const authSchema = insertUserSchema.extend({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
});

type FormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                Login
              </Button>
            </form>
          </Form>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-primary/5 p-12 items-center justify-center">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">
            Async Standup Manager
          </h1>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-6 w-6 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold">Flexible Standup Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage standups asynchronously, perfect for remote teams
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <UserPlus className="h-6 w-6 mt-1 text-primary" />
              <div>
                <h3 className="font-semibold">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Add team members and track their responses easily
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}