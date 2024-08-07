import { useState, useEffect } from "react";
import yaml from "js-yaml";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlusIcon, GearIcon, TrashIcon } from "@radix-ui/react-icons";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function for dialogs
function GenericDialog({ title, description, content, onClose, onSave }) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center">
            <GearIcon className="mr-2" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          <Button type="button" onClick={onSave} className="ml-2">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function for input fields
function InputField({ label, id, name, value, onChange, type = "text" }) {
  return (
    <div className="flex flex-col">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        value={value || ""}
        onChange={onChange}
        type={type}
        className="w-full mb-2"
      />
    </div>
  );
}

// Helper function for textarea fields
function TextareaField({ label, id, name, value, onChange }) {
  return (
    <div className="flex flex-col">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Textarea
        id={id}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full mb-2"
      />
    </div>
  );
}

export const Incidents = ({ user }) => {
  const [incidentsData, setIncidentsData] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    services: "",
  });
  const [settings, setSettings] = useState(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch("/api/incidents");
        const data = await response.json();
        setIncidentsData(data);
      } catch (error) {
        console.error("Failed to fetch incidents", error);
      }
    };

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.text();
        const parsedSettings = yaml.load(data);
        setSettings(parsedSettings);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };

    fetchIncidents();
    fetchSettings();
  }, []);

  const handleOpenCreateDialog = () => {
    setIsCreating(true);
    setFormData({ title: "", description: "", type: "", services: "" });
    setSelectedServices([]);
    setSelectedType("");
    setValidationError("");
  };

  const handleOpenEditDialog = (incident) => {
    setCurrentIncident(incident);
    setFormData({
      title: incident.title,
      description: incident.description,
      type: incident.type,
      services: incident.services,
    });
    setSelectedServices(
      (incident.services || "")
        .split(",")
        .map((service) => service.trim())
        .filter((service) => service),
    );
    setSelectedType(incident.type);
    setIsEditing(true);
    setValidationError("");
  };

  const validateFormData = () => {
    if (!formData.title || !formData.description || !selectedType) {
      setValidationError("Title, description, and type are required.");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSave = async () => {
    if (!validateFormData()) return;
    console.log(
      JSON.stringify({
        ...formData,
        id: currentIncident?.id || null,
        timestamp: currentIncident
          ? currentIncident.timestamp
          : Math.floor(Date.now() / 1000),
        resolved_timestamp: currentIncident?.resolved_timestamp || null,
      }),
    );
    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          id: currentIncident?.id || null,
          timestamp: currentIncident
            ? currentIncident.timestamp
            : Math.floor(Date.now() / 1000),
          resolved_timestamp: currentIncident?.resolved_timestamp || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedIncidents = await fetch("/api/incidents").then((res) =>
          res.json(),
        );
        setIncidentsData(updatedIncidents);
        setIsCreating(false);
        setIsEditing(false);
        setCurrentIncident(null);
      } else {
        console.error("Failed to save incident", result.error);
      }
    } catch (error) {
      console.error("Failed to save incident", error);
    }
  };

  const handleResolve = async (id, isResolved) => {
    try {
      const resolved_timestamp = isResolved
        ? null
        : Math.floor(Date.now() / 1000);

      // Find the existing incident data
      const incident = incidentsData.find((inc) => inc.id === id);

      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          title: incident.title,
          description: incident.description,
          type: incident.type,
          services: incident.services,
          timestamp: incident.timestamp,
          resolved_timestamp: resolved_timestamp,
        }),
      });

      const result = await response.json();
      if (result.success) {
        const updatedIncidents = await fetch("/api/incidents").then((res) =>
          res.json(),
        );
        setIncidentsData(updatedIncidents);
      } else {
        console.error("Failed to update incident", result.error);
      }
    } catch (error) {
      console.error("Failed to update incident", error);
    }
  };

  const handleRemove = async (id) => {
    try {
      const response = await fetch("/api/incidents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.success) {
        const updatedIncidents = await fetch("/api/incidents").then((res) =>
          res.json(),
        );
        setIncidentsData(updatedIncidents);
      } else {
        console.error("Failed to remove incident", result.error);
      }
    } catch (error) {
      console.error("Failed to remove incident", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (url, checked) => {
    const updatedServices = checked
      ? [...selectedServices, url]
      : selectedServices.filter((item) => item !== url);

    setSelectedServices(updatedServices);
    setFormData((prev) => ({ ...prev, services: updatedServices.join(",") }));
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const serviceDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Select Services</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Services</DropdownMenuLabel>
        {settings?.categories.flatMap((category) =>
          category.services.map((service) => (
            <DropdownMenuCheckboxItem
              key={service.url}
              checked={selectedServices.includes(service.url)}
              onCheckedChange={(checked) =>
                handleServiceChange(service.url, checked)
              }
            >
              {service.name}
            </DropdownMenuCheckboxItem>
          )),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const typeSelect = (
    <Select onValueChange={handleTypeChange} value={selectedType || ""}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Type</SelectLabel>
          <SelectItem value="incident">Incident</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  // Check user conditions
  const canEdit = user && user.permLevel <= 1;
  const canCreate = user && user.permLevel <= 1;

  return (
    <div className="flex-grow p-4 overflow-auto max-w-7xl mx-auto w-full">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Latest Incidents
        </h1>
        {canCreate && (
          <div className="flex justify-end mb-4">
            <Button
              variant="secondary"
              onClick={handleOpenCreateDialog}
              className="flex items-center"
            >
              <PlusIcon className="mr-2" />
              Create New Incident
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {incidentsData.map((incident) => {
            const isOngoing = incident.resolved_timestamp
              ? incident.resolved_timestamp > Date.now()
              : true;
            const formattedTimestamp = new Date(
              incident.timestamp,
            ).toLocaleString();
            const formattedResolvedTimestamp = incident.resolved_timestamp
              ? new Date(incident.resolved_timestamp).toLocaleString()
              : "Not resolved";

            return (
              <Card key={incident.id} className="bg-secondary mb-4">
                <CardHeader>
                  <CardTitle>{incident.title}</CardTitle>
                  <CardDescription>{incident.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Type:</span>
                      <Badge
                        variant={
                          incident.type === "incident" ? "danger" : "info"
                        }
                      >
                        {incident.type}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Status:</span>
                      <Badge variant={isOngoing ? "success" : "neutral"}>
                        {isOngoing ? "Ongoing" : "Resolved"}
                      </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Services:</span>
                      <div>
                        {(incident.services || "").split(",").map((service) =>
                          service.trim() ? (
                            <Badge key={service} className="mr-2">
                              {service}
                            </Badge>
                          ) : null,
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Timestamp:</span>
                      <span>{formattedTimestamp}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Resolved Timestamp:</span>
                      <span>{formattedResolvedTimestamp}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex space-x-4">
                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenEditDialog(incident)}
                      >
                        Edit Incident
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleResolve(
                            incident.id,
                            incident.resolved_timestamp !== null,
                          )
                        }
                      >
                        {incident.resolved_timestamp === null
                          ? "Mark as Resolved"
                          : "Unresolve"}
                      </Button>
                    </>
                  )}
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => handleRemove(incident.id)}
                    >
                      Delete Incident
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
      {(isCreating || isEditing) && (
        <GenericDialog
          title={isCreating ? "Create New Incident" : "Edit Incident"}
          description={
            isCreating
              ? "Fill in the details for the new incident."
              : "Update the details of the incident."
          }
          content={
            <>
              {validationError && (
                <div className="text-red-500 mb-4">{validationError}</div>
              )}
              <InputField
                label="Title"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
              <TextareaField
                label="Description"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <div className="mb-4">
                <Label htmlFor="type" className="mb-2 block">
                  Type
                </Label>
                {typeSelect}
              </div>
              <div className="mb-4">
                <Label htmlFor="services" className="mb-2 block">
                  Services
                </Label>
                {serviceDropdown}
              </div>
            </>
          }
          onClose={() => {
            setIsCreating(false);
            setIsEditing(false);
            setCurrentIncident(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
