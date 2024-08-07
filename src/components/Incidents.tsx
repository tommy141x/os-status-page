// Incidents.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Incidents = ({ incidentsData }) => {
  if (!incidentsData) return null;

  return (
    <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Latest Incidents
        </h1>
        <div className="space-y-4">
          {incidentsData.map((incident) => (
            <Card key={incident.id} className="bg-secondary mb-4">
              <CardHeader>
                <CardTitle>{incident.title}</CardTitle>
                <CardDescription>
                  {new Date(incident.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{incident.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
