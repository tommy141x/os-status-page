import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/themeToggle";

export function Settings({ user }) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div
          className="flex justify-between items-center"
          style={{ fontSize: "1.5rem" }}
        >
          <CardTitle className="text-2xl">Welcome, {user.username}</CardTitle>
          <ThemeToggle />
        </div>
        <CardDescription>Email: {user.username}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">Logout</Button>
      </CardFooter>
    </Card>
  );
}
