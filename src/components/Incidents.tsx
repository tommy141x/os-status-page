import { useState, useCallback, useEffect, memo } from "react";
import { HeaderNav } from "@/components/headerNav";
import yaml from "js-yaml";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Settings,
  Ban,
  Trash2,
  Plus,
  CircleCheck,
  CircleMinus,
  CircleHelp,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
            <Settings className="mr-2" />
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

const getStatusColor = (status, isText) => {
  switch (status) {
    case "online":
      return isText ? "text-green-500" : "bg-green-500";
    case "issues":
      return isText ? "text-yellow-500" : "bg-yellow-500";
    case "offline":
      return isText ? "text-red-500" : "bg-red-500";
    default:
      return isText ? "text-gray-500" : "bg-gray-500";
  }
};

const StatusIconMap = ({ status, size }) => {
  // Determine the appropriate icon and color based on status
  let Icon, colorClass;

  switch (status) {
    case "online":
      Icon = CircleCheck;
      colorClass = "text-green-500";
      break;
    case "issues":
      Icon = CircleMinus;
      colorClass = "text-yellow-500";
      break;
    case "offline":
      Icon = Ban;
      colorClass = "text-red-500";
      break;
    default:
      Icon = CircleHelp;
      colorClass = "text-gray-500";
      break;
  }

  return (
    <Icon
      className={`mr-2 ${colorClass}`}
      style={{ width: size, height: size }}
    />
  );
};

export const Incidents = memo(({ user }) => {
  const [statusData, setStatusData] = useState(null);
  const [incidentsData, setIncidentsData] = useState([]);
  const [error, setError] = useState(null);
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

  const sortIncidents = (incidents) => {
    return incidents.sort((a, b) => {
      // If both incidents have no resolved_timestamp, compare using timestamp
      if (!a.resolved_timestamp && !b.resolved_timestamp) {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }

      // If a has no resolved_timestamp but b does, a should come first
      if (!a.resolved_timestamp && b.resolved_timestamp) {
        return -1;
      }

      // If b has no resolved_timestamp but a does, b should come first
      if (a.resolved_timestamp && !b.resolved_timestamp) {
        return 1;
      }

      // If both incidents have resolved_timestamp, compare them
      if (a.resolved_timestamp && b.resolved_timestamp) {
        return b.resolved_timestamp - a.resolved_timestamp;
      }

      // Fallback to timestamp comparison if necessary
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  };

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

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

  const fetchStatusData = useCallback(async () => {
    try {
      const response = await fetch("/api/status");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatusData(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const fetchIncidentsData = useCallback(async () => {
    try {
      const response = await fetch("/api/incidents");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setIncidentsData(sortIncidents(data));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchStatusData(), fetchIncidentsData()]);
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, [fetchStatusData, fetchIncidentsData]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        Error: {error}
      </div>
    );
  }

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
        setIncidentsData(sortIncidents(updatedIncidents));
        refreshData();
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
        setIncidentsData(sortIncidents(updatedIncidents));
        refreshData();
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
        setIncidentsData(sortIncidents(updatedIncidents));
        refreshData();
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
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full p-4">
      <HeaderNav
        user={user}
        tabs={[
          { value: "", label: "Status" },
          { value: "incidents", label: "Incidents", active: true },
        ]}
      />
      <section className="text-center my-12 cursor-default">
        {!statusData || statusData.overallStatus === "online" ? (
          <div className="flex flex-col items-center">
            <StatusIconMap status="online" size="3rem" />
            <h1 className="text-primary font-bold text-4xl my-4">
              All services are online
            </h1>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <StatusIconMap status={statusData?.overallStatus} size="3rem" />
            <h1 className="text-primary font-bold text-4xl my-4">
              Some services are having issues
            </h1>
          </div>
        )}
        <p className="text-md mb-6 text-muted-foreground">
          Last updated {formatter.format(statusData?.lastUpdate)}
        </p>
        {canCreate && (
          <div className="flex justify-end mb-4">
            <Button
              variant="secondary"
              onClick={handleOpenCreateDialog}
              className="flex items-center"
            >
              <Plus className="mr-2" />
              Create New Incident
            </Button>
          </div>
        )}
        {incidentsData?.length === 0 && (
          <div className="flex flex-col items-center my-20">
            <h2 className="text-2xl font-bold text-primary">
              No incidents to display
            </h2>
            <p className="text-md mt-2 text-muted-foreground">
              There are currently no incidents to display
            </p>
          </div>
        )}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {incidentsData?.map((incident) => {
            const isOngoing = incident.resolved_timestamp
              ? incident.resolved_timestamp > Date.now()
              : true;
            const formattedTimestamp = formatter.format(
              incident.timestamp * 1000,
            );
            const formattedResolvedTimestamp = incident.resolved_timestamp
              ? formatter.format(incident.resolved_timestamp * 1000)
              : "Not resolved";

            return (
              <AccordionItem
                key={incident.id}
                value={`incident-${incident.id}`}
                className="mb-4"
              >
                <Card className="bg-secondary">
                  <CardHeader>
                    <AccordionTrigger className="w-full">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center space-x-4">
                          <CardTitle className="text-2xl -mt-1.5">
                            {incident.title}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className={
                              incident.type === "incident"
                                ? "bg-red-500 cursor-default"
                                : "bg-yellow-500 cursor-default"
                            }
                          >
                            {incident.type === "incident"
                              ? "Incident"
                              : "Maintenance"}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Badge
                            variant="secondary"
                            className={
                              isOngoing
                                ? "bg-red-500 cursor-default mr-2"
                                : "bg-green-500 cursor-default mr-2"
                            }
                          >
                            {isOngoing ? "Unresolved" : "Resolved"}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                  </CardHeader>
                  <AccordionContent>
                    <CardContent>
                      <div className="space-y-4">
                        <CardDescription className="text-left text-md">
                          {incident.description}
                        </CardDescription>
                        <h2 className="text-xl font-bold text-left">
                          Affected Services
                        </h2>
                        {(incident.services || "")
                          .split(",")
                          .map((serviceUrl) => {
                            if (!serviceUrl.trim()) return null;

                            const service = statusData?.categories
                              .flatMap((category) => category.services)
                              .find((s) => s.url === serviceUrl.trim());

                            if (!service) return null;

                            return (
                              <Card
                                className="w-full bg-background"
                                key={service.url}
                              >
                                <CardHeader className="-m-2 -mb-4">
                                  <div className="flex items-center justify-between w-full">
                                    <CardTitle className="flex items-center">
                                      <StatusIconMap
                                        status={service.status}
                                        size={22}
                                      />
                                      <span
                                        className={`text-lg ${getStatusColor(service.status, true)}`}
                                      >
                                        {service.name}
                                      </span>
                                    </CardTitle>
                                    <p className="text-md text-muted-foreground">
                                      {service.description}
                                    </p>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {/* Other content can go here */}
                                </CardContent>
                              </Card>
                            );
                          })}
                        <p className="text-sm text-muted-foreground">
                          This incident started on {formattedTimestamp}
                          {!isOngoing &&
                            ` and was resolved on ${formattedResolvedTimestamp}`}
                          .
                        </p>
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
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
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
});
