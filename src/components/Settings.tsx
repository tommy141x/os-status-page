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
//import { toast } from "sonner"; BROKEN BY VIEW TRANSITIONS
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
import {
  PlusIcon,
  GearIcon,
  CrossCircledIcon,
  CheckCircledIcon,
  MinusCircledIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
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
    setLocalService((prev) => ({ ...prev, hide_url: e }));
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
                onCheckedChange={handleCheckboxChange}
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

function CategoryDialog({ category, onClose, onSave, isNew }) {
  const [localCategory, setLocalCategory] = useState(category);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalCategory((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(localCategory);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center">
            <GearIcon className="mr-2" />
            <DialogTitle>
              {isNew ? "Add Category" : "Edit Category"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isNew
              ? "Add a new category."
              : "Modify the details for this category."}
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
                value={localCategory.name}
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
                value={localCategory.description}
                onChange={handleChange}
                className="w-full"
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
  const [settings, setSettings] = useState({ categories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogType, setDialogType] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
      } catch (error) {
        console.error("Failed to autosave settings", error);
      }
    };
    if (!loading) {
      autosave();
    }
  }, [settings]);

  const handleServiceSave = (updatedService) => {
    if (editIndex !== null) {
      const newCategories = [...settings.categories];
      const categoryIndex = newCategories.findIndex((cat) =>
        cat.services.some((_, index) => index === editIndex),
      );
      newCategories[categoryIndex].services[editIndex] = updatedService;
      setSettings((prevSettings) => ({
        ...prevSettings,
        categories: newCategories,
      }));
    } else {
      const newCategories = [...settings.categories];
      const categoryIndex = newCategories.findIndex(
        (cat) => cat.name === selectedCategory,
      );
      newCategories[categoryIndex].services.push(updatedService);
      setSettings((prevSettings) => ({
        ...prevSettings,
        categories: newCategories,
      }));
    }
    setDialogType(null);
    setEditIndex(null);
  };

  const handleCategorySave = (updatedCategory) => {
    if (editIndex !== null) {
      const newCategories = [...settings.categories];
      newCategories[editIndex] = {
        ...updatedCategory,
        services: newCategories[editIndex].services,
      };
      setSettings((prevSettings) => ({
        ...prevSettings,
        categories: newCategories,
      }));
    } else {
      setSettings((prevSettings) => ({
        ...prevSettings,
        categories: [
          ...prevSettings.categories,
          { ...updatedCategory, services: [] },
        ],
      }));
    }
    setDialogType(null);
    setEditIndex(null);
  };

  const handleCancelDialog = () => {
    setDialogType(null);
    setSelectedService(null);
    setSelectedCategory(null);
  };

  const handleAddCategory = () => {
    setDialogType("addCategory");
    setSelectedCategory({
      name: "",
      description: "",
    });
  };

  const handleAddService = (categoryName) => {
    setDialogType("addService");
    setSelectedCategory(categoryName);
    setSelectedService({
      name: "",
      description: "",
      url: "",
      hide_url: false,
      expected_response_code: 200,
    });
  };

  const handleEditService = (categoryIndex, serviceIndex) => {
    setDialogType("editService");
    setEditIndex(serviceIndex);
    setSelectedService(
      settings.categories[categoryIndex].services[serviceIndex],
    );
  };

  const handleEditCategory = (index) => {
    setDialogType("editCategory");
    setEditIndex(index);
    setSelectedCategory(settings.categories[index]);
  };

  const handleRemoveService = (categoryIndex, serviceIndex) => {
    const newCategories = [...settings.categories];
    newCategories[categoryIndex].services = newCategories[
      categoryIndex
    ].services.filter((_, i) => i !== serviceIndex);
    setSettings((prevSettings) => ({
      ...prevSettings,
      categories: newCategories,
    }));
  };

  const handleRemoveCategory = (index) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      categories: prevSettings.categories.filter((_, i) => i !== index),
    }));
  };

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
                      <Button variant="secondary" onClick={handleAddCategory}>
                        Add Category
                      </Button>
                    </div>
                    <CardDescription>
                      Manage your application settings here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {settings.categories.map((category, categoryIndex) => (
                        <Card key={categoryIndex} className="p-4">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle>{category.name}</CardTitle>
                                <CardDescription>
                                  {category.description}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleEditCategory(categoryIndex)
                                  }
                                >
                                  <GearIcon />
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleRemoveCategory(categoryIndex)
                                  }
                                >
                                  <CrossCircledIcon />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {category.services.map((service, serviceIndex) => (
                              <div
                                key={serviceIndex}
                                className="flex items-center gap-4 mb-4"
                              >
                                <Card className="flex-grow p-1">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
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
                                          onClick={() =>
                                            handleEditService(
                                              categoryIndex,
                                              serviceIndex,
                                            )
                                          }
                                        >
                                          <GearIcon />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() =>
                                            handleRemoveService(
                                              categoryIndex,
                                              serviceIndex,
                                            )
                                          }
                                        >
                                          <CrossCircledIcon />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => handleAddService(category.name)}
                              className="w-full"
                            >
                              <PlusIcon className="mr-2" /> Add Service
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {dialogType === "addService" && (
                        <ServiceDialog
                          service={selectedService}
                          onClose={handleCancelDialog}
                          onSave={handleServiceSave}
                          isNew={true}
                        />
                      )}
                      {dialogType === "editService" && (
                        <ServiceDialog
                          service={selectedService}
                          onClose={handleCancelDialog}
                          onSave={handleServiceSave}
                          isNew={false}
                        />
                      )}
                      {(dialogType === "addCategory" ||
                        dialogType === "editCategory") && (
                        <CategoryDialog
                          category={selectedCategory}
                          onClose={handleCancelDialog}
                          onSave={handleCategorySave}
                          isNew={dialogType === "addCategory"}
                        />
                      )}
                    </div>
                    <Separator className="my-4" />
                    <CardDescription>
                      Other Application Settings
                    </CardDescription>
                    <div>
                      <Label htmlFor="data-retention-hours">
                        Data Retention Hours
                      </Label>
                      <Input
                        id="data-retention-hours"
                        name="data_retention_hours"
                        type="number"
                        value={settings.data_retention_hours || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            data_retention_hours: e.target.value,
                          }))
                        }
                      />
                      <Label htmlFor="check-interval-minutes">
                        Check Interval Minutes
                      </Label>
                      <Input
                        id="check-interval-minutes"
                        name="check_interval_minutes"
                        type="number"
                        value={settings.check_interval_minutes || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            check_interval_minutes: e.target.value,
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
