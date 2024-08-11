import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronsLeft } from "lucide-react";
import { navigate } from "astro:transitions/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const payload = JSON.stringify({ email, password });
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.log("Error response:", errorData);
        throw new Error(errorData || "Login failed");
      } else {
        // Redirect to the base URL on successful login
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.message || "An error occurred during login");
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex flex-col items-start">
            <Button
              variant="ghost"
              className="flex items-center px-1"
              onClick={() => navigate("/")}
            >
              <ChevronsLeft className="mr-1" />
              <p>Back</p>
            </Button>

            <CardTitle className="text-2xl mt-2">Welcome</CardTitle>
          </div>

          <CardDescription>Please login to continue</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@appleseed.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="UnicornsAreReal123"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit">
            Login
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
