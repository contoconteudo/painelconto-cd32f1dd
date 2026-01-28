import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { User, Plus, Trash2, Edit, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface UserWithProjects {
  id: string;
  email: string;
  user_roles: { role: string }[];
  user_projects: {
    project_id: string;
    permissions: string[];
    projects: { name: string };
  }[];
}

export default function AdminDashboard() {
  const { projects } = useProject();
  const [users, setUsers] = useState<UserWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setUserRole] = useState<"admin" | "user">("user");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["read"]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth.users')
        .select(`
          id,
          email,
          user_roles (role),
          user_projects (
            project_id,
            permissions,
            projects (name)
          )
        `);

      if (error) throw error;
      setUsers(data as UserWithProjects[] || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !selectedProject) return;

    try {
      // First, create the user in auth.users (this would normally be done via Supabase Auth signup)
      // For now, we'll assume the user already exists and we just need to assign roles and projects
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', newUserEmail)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return;
      }

      // Assign role
      await supabase
        .from('user_roles')
        .upsert({ user_id: userData.id, role: newUserRole });

      // Assign project permissions
      await supabase
        .from('user_projects')
        .upsert({
          user_id: userData.id,
          project_id: selectedProject,
          permissions: selectedPermissions,
        });

      await fetchUsers();
      setShowAddUser(false);
      setNewUserEmail("");
      setUserRole("user");
      setSelectedProject("");
      setSelectedPermissions(["read"]);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await supabase
        .from('user_projects')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      await fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  return (
    <AppLayout title="Admin Dashboard" subtitle="Manage users and projects">
      <div className="space-y-6">
        {/* Add User Section */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Manage Users</h3>
            <Button onClick={() => setShowAddUser(true)} className="gradient-primary text-primary-foreground gap-1.5">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="role" className="text-right">
                    Role
                  </label>
                  <Select value={newUserRole} onValueChange={(value: "admin" | "user") => setUserRole(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="project" className="text-right">
                    Project
                  </label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="permissions" className="text-right">
                    Permissions
                  </label>
                  <div className="col-span-3 space-y-2">
                    {["read", "write", "delete"].map((perm) => (
                      <label key={perm} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPermissions([...selectedPermissions, perm]);
                            } else {
                              setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                            }
                          }}
                        />
                        <span className="capitalize">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <div className="stat-card">
          <h3 className="section-title mb-4">Users</h3>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        user.user_roles[0]?.role === 'admin' 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {user.user_roles[0]?.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_projects.map((up) => (
                          <Badge key={up.project_id} variant="secondary" className="text-xs">
                            {up.projects.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}