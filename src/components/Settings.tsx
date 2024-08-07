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
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  GearIcon,
  CrossCircledIcon,
  DoubleArrowDownIcon,
  EnvelopeOpenIcon,
  PersonIcon,
  LapTimerIcon,
} from "@radix-ui/react-icons";
import * as yaml from "js-yaml";
import { HeaderNav } from "@/components/headerNav";

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
        className="w-full"
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

export function Settings({ user }) {
  const [settings, setSettings] = useState({ categories: [], mail: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogType, setDialogType] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([fetch("/api/settings"), fetch("/api/users")])
      .then(([settingsResponse, usersResponse]) =>
        Promise.all([settingsResponse.text(), usersResponse.json()]),
      )
      .then(([settingsData, usersData]) => {
        try {
          const parsedSettings = yaml.load(settingsData);
          setSettings(parsedSettings);
          setUsers(usersData);
        } catch (err) {
          setError("Failed to parse settings or users");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch settings or users");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const autosave = async () => {
      if (!loading) {
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
      }
    };
    autosave();
  }, [settings, loading]);

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

  const handleMailSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      mail: {
        ...prev.mail,
        ...(name.startsWith("smtp.")
          ? {
              smtp: {
                ...prev.mail.smtp,
                [name.split(".")[1]]: value,
              },
            }
          : { [name]: value }),
      },
    }));
  };

  const handleMailEnabledChange = (enabled) => {
    setSettings((prev) => ({
      ...prev,
      mail: { ...prev.mail, enabled },
    }));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAddUser = async () => {
    // This is a placeholder. You'll need to implement user creation in your API
    console.log("Add user functionality not implemented");
  };

  const handleUpdateUserRole = async (id, email, newPermLevel) => {
    try {
      console.log({ id, permLevel: newPermLevel });
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, email, permLevel: newPermLevel }),
      });
      if (!response.ok) throw new Error("Failed to update user role");
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    // This is a placeholder. You'll need to implement user deletion in your API
    console.log("Delete user functionality not implemented");
  };

  if (error) return <div>{error}</div>;

  return (
    <HeaderNav
      user={user}
      showSettings={false}
      showUpdates={false}
      tabs={[
        {
          value: "general",
          label: "General",
          content: (
            <div className="flex-grow overflow-auto">
              <div className="flex-grow flex flex-col items-center justify-center">
                <Card className="w-full max-w-4xl mx-auto p-4 my-10">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <GearIcon className="mr-1.5 w-5 h-5" />
                        <CardTitle className="text-2xl">General</CardTitle>
                      </div>
                    </div>
                    <CardDescription>
                      Manage your general settings here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <InputField
                        label="Application Name"
                        id="name"
                        name="name"
                        type="text"
                        value={settings.name || ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card className="w-full max-w-4xl mx-auto p-4 my-5">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <EnvelopeOpenIcon className="mr-1.5 w-5 h-5" />
                        <CardTitle className="text-2xl">Mail</CardTitle>
                      </div>
                      <Switch
                        checked={settings.mail.enabled}
                        onCheckedChange={handleMailEnabledChange}
                      />
                    </div>
                    <CardDescription>
                      Manage your mail related settings here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <InputField
                        label="SMTP Host"
                        id="smtp-host"
                        name="smtp.host"
                        value={settings.mail?.smtp?.host || ""}
                        onChange={handleMailSettingChange}
                      />
                      <InputField
                        label="SMTP Port"
                        id="smtp-port"
                        name="smtp.port"
                        type="number"
                        value={settings.mail?.smtp?.port || ""}
                        onChange={handleMailSettingChange}
                      />
                      <InputField
                        label="SMTP Username"
                        id="smtp-username"
                        name="smtp.username"
                        value={settings.mail?.smtp?.username || ""}
                        onChange={handleMailSettingChange}
                      />
                      <InputField
                        label="SMTP Password"
                        id="smtp-password"
                        name="smtp.password"
                        type="password"
                        value={settings.mail?.smtp?.password || ""}
                        onChange={handleMailSettingChange}
                      />
                      <InputField
                        label="Send From"
                        id="send-from"
                        name="send_from"
                        value={settings.mail?.send_from || ""}
                        onChange={handleMailSettingChange}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ),
        },
        {
          value: "services",
          label: "Services",
          content: (
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
          ),
        },
        {
          value: "users",
          label: "Users",
          content: (
            <div className="flex-grow overflow-auto">
              <div className="flex-grow flex items-center justify-center">
                <Card className="w-full max-w-4xl mx-auto p-4 my-10">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <PersonIcon className="mr-1.5 w-5 h-5" />
                        <CardTitle className="text-2xl">Users</CardTitle>
                      </div>
                      <Button variant="secondary" onClick={handleAddUser}>
                        Add User
                      </Button>
                    </div>
                    <CardDescription>
                      Manage and add your users here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    disabled={user.id === 1}
                                  >
                                    {user.permLevel === 0 ? "Admin" : "Manager"}
                                    <DoubleArrowDownIcon className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                  <DropdownMenuLabel>
                                    Select Role
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuRadioGroup
                                    value={user.permLevel}
                                    onValueChange={(value) =>
                                      handleUpdateUserRole(
                                        user.id,
                                        user.email,
                                        value,
                                      )
                                    }
                                  >
                                    <DropdownMenuRadioItem value={0}>
                                      Admin
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value={1}>
                                      Manager
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={user.id === 1}
                              >
                                <CrossCircledIcon />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Separator className="my-4" />
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
