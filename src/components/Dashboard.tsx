// components/LandingPage.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/themeToggle";

export function Dashboard({ user }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <header className="w-full flex justify-end p-4">
        <ThemeToggle />
      </header>

      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">Status Page</h1>
        <p className="text-lg mb-6 text-foreground">
          We provide amazing solutions for your needs. Explore our services and
          products below.
        </p>
        <Button variant="outline" className="mb-4">
          Kill Server
        </Button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card>
          <h2 className="text-xl font-semibold mb-2 text-primary">
            Service One
          </h2>
          <p className="mb-4 text-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <Button variant="secondary">Learn More</Button>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-2 text-primary">
            Service Two
          </h2>
          <p className="mb-4 text-foreground">
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <Button variant="secondary">Learn More</Button>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold mb-2 text-primary">
            Service Three
          </h2>
          <p className="mb-4 text-foreground">
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
          </p>
          <Button variant="secondary">Learn More</Button>
        </Card>
      </section>
    </div>
  );
}
