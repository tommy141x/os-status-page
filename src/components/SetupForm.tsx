import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/themeToggle";

export function SetupForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div
          className="flex justify-between items-center"
          style={{ fontSize: "1.5rem" }}
        >
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <ThemeToggle />
        </div>
        <CardDescription>Please create an account to continue</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="johnappleseed@gmail.com"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="UnicornsAreReal123"
            required
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Continue</Button>
      </CardFooter>
    </Card>
  );
}
