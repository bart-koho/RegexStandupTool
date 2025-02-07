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
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Login to manage your team standups
            </p>
          </div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
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
                      <Input type="password" placeholder="Enter your password" {...field} />
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
      <div className="hidden lg:block lg:w-1/2 bg-primary/5">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-md space-y-8">
            <h1 className="text-4xl font-bold tracking-tight">
              Async Standup Manager
            </h1>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Calendar className="mt-1 h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">Flexible Standup Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Create and manage standups asynchronously, perfect for remote teams
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <UserPlus className="mt-1 h-6 w-6 text-primary flex-shrink-0" />
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
    </div>
  );
}