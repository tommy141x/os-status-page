import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PersonIcon, CrossCircledIcon, GearIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        value={value}
        onChange={onChange}
        type={type}
        className="w-full"
      />
    </div>
  );
}

export function UsersSettings() {
  const [users, setUsers] = useState([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    permLevel: "1", // Default to Manager
  });

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

  const handleAddUser = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleAddUserSave = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newUser,
          id: Date.now(), // Generate a temporary ID
          permLevel: parseInt(newUser.permLevel, 10),
        }),
      });
      if (!response.ok) throw new Error("Failed to add user");
      setIsAddUserDialogOpen(false);
      fetchUsers(); // Refresh the user list
      setNewUser({ email: "", password: "", permLevel: "1" }); // Reset form
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleUpdateUserRole = async (id, email, newPermLevel) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          email,
          permLevel: parseInt(newPermLevel, 10),
        }),
      });
      if (!response.ok) throw new Error("Failed to update user role");
      fetchUsers(); // Refresh the user list
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      const result = await response.json();

      if (result.success) {
        // User successfully deleted, refresh the user list
        fetchUsers();
      } else {
        throw new Error(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      // You might want to show an error message to the user here
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUserDialogContent = (
    <>
      <InputField
        label="Email"
        id="email"
        name="email"
        value={newUser.email}
        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
      />
      <InputField
        label="Password"
        id="password"
        name="password"
        type="password"
        value={newUser.password}
        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
      />
      <div className="flex flex-col">
        <Label htmlFor="role" className="mb-2">
          Role
        </Label>
        <Select
          value={newUser.permLevel}
          onValueChange={(value) =>
            setNewUser({ ...newUser, permLevel: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Roles</SelectLabel>
              <SelectItem value="0">Admin</SelectItem>
              <SelectItem value="1">Manager</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
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
            <CardDescription>Manage and add your users here.</CardDescription>
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
                      <Select
                        value={user.permLevel.toString()}
                        onValueChange={(value) =>
                          handleUpdateUserRole(user.id, user.email, value)
                        }
                        disabled={user.id === 1}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Roles</SelectLabel>
                            <SelectItem value="0">Admin</SelectItem>
                            <SelectItem value="1">Manager</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
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
      {isAddUserDialogOpen && (
        <GenericDialog
          title="Add User"
          description="Enter the details for the new user."
          content={addUserDialogContent}
          onClose={() => setIsAddUserDialogOpen(false)}
          onSave={handleAddUserSave}
        />
      )}
    </div>
  );
}
