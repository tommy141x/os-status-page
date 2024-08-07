import { useState } from "react";
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
  LapTimerIcon,
} from "@radix-ui/react-icons";

// Define response codes
const responseCodes = [200, 201, 400, 404, 500];

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
        value={value}
        onChange={onChange}
        type={type}
        className="w-full mb-2"
      />
    </div>
  );
}

function ServiceDialog({ service, onClose, onSave, isNew }) {
  const [localService, setLocalService] = useState(service);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalService((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setLocalService((prev) => ({ ...prev, hide_url: e }));
  };

  const content = (
    <div className="grid gap-4 py-4">
      <InputField
        label="Name"
        id="name"
        name="name"
        value={localService.name}
        onChange={handleChange}
      />
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
      <InputField
        label="URL"
        id="url"
        name="url"
        value={localService.url}
        onChange={handleChange}
      />
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
  );

  return (
    <GenericDialog
      title={isNew ? "Add Service" : "Edit Service"}
      description={
        isNew ? "Add a new service." : "Modify the details for this service."
      }
      content={content}
      onClose={onClose}
      onSave={() => onSave(localService)}
    />
  );
}

function CategoryDialog({ category, onClose, onSave, isNew }) {
  const [localCategory, setLocalCategory] = useState(category);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalCategory((prev) => ({ ...prev, [name]: value }));
  };

  const content = (
    <div className="grid gap-4 py-4">
      <InputField
        label="Name"
        id="name"
        name="name"
        value={localCategory.name}
        onChange={handleChange}
      />
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
  );

  return (
    <GenericDialog
      title={isNew ? "Add Category" : "Edit Category"}
      description={
        isNew ? "Add a new category." : "Modify the details for this category."
      }
      content={content}
      onClose={onClose}
      onSave={() => onSave(localCategory)}
    />
  );
}

export function ServicesSettings({ settings, setSettings }) {
  const [dialogType, setDialogType] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  const handleServiceSave = (updatedService) => {
    setSettings((prevSettings) => {
      const newCategories = [...prevSettings.categories];
      const categoryIndex = newCategories.findIndex(
        (cat) => cat.name === selectedCategory,
      );
      if (editIndex !== null) {
        newCategories[categoryIndex].services[editIndex] = updatedService;
      } else {
        newCategories[categoryIndex].services.push(updatedService);
      }
      return { ...prevSettings, categories: newCategories };
    });
    setDialogType(null);
    setEditIndex(null);
  };

  const handleCategorySave = (updatedCategory) => {
    setSettings((prevSettings) => {
      const newCategories = [...prevSettings.categories];
      if (editIndex !== null) {
        newCategories[editIndex] = {
          ...updatedCategory,
          services: newCategories[editIndex].services,
        };
      } else {
        newCategories.push({ ...updatedCategory, services: [] });
      }
      return { ...prevSettings, categories: newCategories };
    });
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
    setSelectedCategory({ name: "", description: "" });
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
    setSelectedCategory(settings.categories[categoryIndex].name);
  };

  const handleEditCategory = (index) => {
    setDialogType("editCategory");
    setEditIndex(index);
    setSelectedCategory(settings.categories[index]);
  };

  const handleRemoveService = (categoryIndex, serviceIndex) => {
    setSettings((prevSettings) => {
      const newCategories = [...prevSettings.categories];
      newCategories[categoryIndex].services = newCategories[
        categoryIndex
      ].services.filter((_, i) => i !== serviceIndex);
      return { ...prevSettings, categories: newCategories };
    });
  };

  const handleRemoveCategory = (index) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      categories: prevSettings.categories.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex-grow overflow-auto">
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-4xl mx-auto p-4 my-10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <LapTimerIcon className="mr-1.5 w-5 h-5" />
                <CardTitle className="text-2xl">Services</CardTitle>
              </div>
              <Button variant="secondary" onClick={handleAddCategory}>
                Add Category
              </Button>
            </div>
            <CardDescription>
              Manage your service related settings here.
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
                          onClick={() => handleEditCategory(categoryIndex)}
                        >
                          <GearIcon />
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRemoveCategory(categoryIndex)}
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
            <div>
              <InputField
                label="Data Retention Hours"
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
              <InputField
                label="Check Interval Minutes"
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
