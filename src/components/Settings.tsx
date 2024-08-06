import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GearIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import * as yaml from "js-yaml";
import { HeaderNav } from "@/components/headerNav";

// Define response codes
const responseCodes = [200, 201, 400, 404, 500];

function ServiceDialog({ service, onClose, onSave, isNew }) {
  const [localService, setLocalService] = useState(service);
  useEffect(() => {
    setLocalService(service);
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalService((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setLocalService((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSave = () => {
    onSave(localService);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center">
            <GearIcon className="mr-2" />
            <DialogTitle>{isNew ? "Add Service" : "Edit Service"}</DialogTitle>
          </div>
          <DialogDescription>
            {isNew
              ? "Add a new service."
              : "Modify the details for this service."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col">
              <Label htmlFor="name" className="mb-2">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={localService.name}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="description" className="mb-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={localService.description}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="url" className="mb-2">
                URL
              </Label>
              <Input
                id="url"
                name="url"
                value={localService.url}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="expected_response_code" className="mb-2">
                Expected Response Code
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full" asChild>
                  <Button variant="outline">
                    {localService.expected_response_code}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {responseCodes.map((code) => (
                    <DropdownMenuItem
                      key={code}
                      onSelect={() =>
                        setLocalService((prev) => ({
                          ...prev,
                          expected_response_code: code,
                        }))
                      }
                    >
                      {code}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center">
              <Label htmlFor="hide_url" className="mr-2">
                Hide URL
              </Label>
              <Checkbox
                id="hide_url"
                name="hide_url"
                checked={localService.hide_url}
                onChange={handleCheckboxChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} className="ml-2">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Settings({ user }) {
  const [settings, setSettings] = useState({ services: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogType, setDialogType] = useState(null); // Manage dialog type: "add" or "edit"
  const [selectedService, setSelectedService] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        return response.text();
      })
      .then((data) => {
        try {
          const parsedData = yaml.load(data);
          setSettings(parsedData);
        } catch (err) {
          setError("Failed to parse settings");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch settings");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const autosave = async () => {
      try {
        const yamlData = yaml.dump(settings);
        await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-yaml",
          },
          body: yamlData,
        });
        toast("Settings Saved");
      } catch (error) {
        toast("There was an error saving settings. Please try again.");
        console.error("Failed to autosave settings", error);
      }
    };
    // Autosave on settings change
    if (!loading) {
      autosave();
    }
  }, [settings]);

  const handleServiceSave = (updatedService) => {
    if (editIndex !== null) {
      const newServices = [...settings.services];
      newServices[editIndex] = updatedService;
      setSettings((prevSettings) => ({
        ...prevSettings,
        services: newServices,
      }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        services: [...prevSettings.services, updatedService],
      }));
    }
    setDialogType(null); // Close the dialog
    setEditIndex(null);
  };

  const handleCancelDialog = () => {
    setDialogType(null); // Close the dialog
    setSelectedService(null);
  };

  const handleAddService = () => {
    setDialogType("add");
    setSelectedService({
      name: "",
      description: "",
      url: "",
      hide_url: false,
      expected_response_code: 200,
    });
  };

  const handleEditService = (index) => {
    setDialogType("edit");
    setEditIndex(index);
    setSelectedService(settings.services[index]);
  };

  const handleRemoveService = (index) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      services: prevSettings.services.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <SettingsSkeleton />;
  if (error) return <div>{error}</div>;

  return (
    <HeaderNav
      user={user}
      showSettings={false}
      showUpdates={false}
      tabs={[
        {
          value: "status",
          label: "Status",
          content: (
            <div className="flex-grow overflow-auto">
              <div className="flex-grow flex items-center justify-center">
                <Card className="w-full max-w-4xl mx-auto p-4 my-10">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <GearIcon className="mr-2" />
                        <CardTitle className="text-2xl">Settings</CardTitle>
                      </div>
                      <Button variant="secondary" onClick={handleAddService}>
                        Add Service
                      </Button>
                    </div>
                    <CardDescription>
                      Manage your application settings here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {settings.services.map((service, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Card className="flex-grow p-4">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <GearIcon className="mr-2" />
                                  <div>
                                    <CardTitle>{service.name}</CardTitle>
                                    <CardDescription>
                                      {service.description}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleEditService(index)}
                                  >
                                    <GearIcon />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleRemoveService(index)}
                                  >
                                    <CrossCircledIcon />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        </div>
                      ))}
                      {dialogType && (
                        <ServiceDialog
                          service={selectedService}
                          onClose={handleCancelDialog}
                          onSave={handleServiceSave}
                          isNew={dialogType === "add"}
                        />
                      )}
                    </div>
                    <Separator className="my-4" />
                    <CardDescription>
                      Other Application Settings
                    </CardDescription>
                    <div>
                      <Label htmlFor="data-retention-days">
                        Data Retention Days
                      </Label>
                      <Input
                        id="data-retention-days"
                        name="data_retention_days"
                        type="number"
                        value={settings.data_retention_days || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            data_retention_days: e.target.value,
                          }))
                        }
                      />
                      <Label htmlFor="check-interval-seconds">
                        Check Interval Seconds
                      </Label>
                      <Input
                        id="check-interval-seconds"
                        name="check_interval_seconds"
                        type="number"
                        value={settings.check_interval_seconds || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            check_interval_seconds: e.target.value,
                          }))
                        }
                      />
                      <Label htmlFor="secret">Secret</Label>
                      <Input
                        id="secret"
                        name="secret"
                        type="text"
                        value={settings.secret || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            secret: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex-grow overflow-auto">
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-4xl mx-auto p-4">
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full mb-4" />
            <Skeleton className="h-40 w-full mb-4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
