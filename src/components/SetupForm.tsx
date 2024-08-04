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

/*import { Database } from "bun:sqlite";
import { loadConfig } from "@/lib/server-utils";

Functions we can do:
let config = await loadConfig();
console.log(config.secret); //jwt secret
const db = new Database("statusdb.sqlite"); //db with users table (id, username, password, permLevel)
const password = "super-secure-pa$$word";
const hash = await Bun.password.hash(password);

const isMatch = await Bun.password.verify(password, hash);
// this form should is to setup the first user with perm level 0 and store in db
// we also need a way to store authentication in the session or something for later use in this astro project
*/

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
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="username"
            placeholder="johnappleseed"
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
