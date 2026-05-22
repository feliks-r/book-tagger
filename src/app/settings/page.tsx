"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sun, Moon, Monitor } from "lucide-react";

// ------------------------------------------------------------------
// Account Settings Tab
// ------------------------------------------------------------------
function AccountTab() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [usernameMsg, setUsernameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSaveUsername() {
    setSavingUsername(true);
    setUsernameMsg(null);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) {
      setUsernameMsg({ type: "error", text: data.error });
    } else {
      setUsernameMsg({ type: "success", text: "Username updated." });
    }
    setSavingUsername(false);
  }

  async function handleSaveEmail() {
    setSavingEmail(true);
    setEmailMsg(null);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEmailMsg({ type: "error", text: data.error });
    } else {
      setEmailMsg({ type: "success", text: "Check your new email to confirm the change." });
    }
    setSavingEmail(false);
  }

  async function handleSavePassword() {
    setSavingPassword(true);
    setPasswordMsg(null);

    if (password !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match." });
      setSavingPassword(false);
      return;
    }

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordMsg({ type: "error", text: data.error });
    } else {
      setPasswordMsg({ type: "success", text: "Password updated." });
      setPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-8 max-w-lg">
      {/* Username */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Username</h3>
        <div className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="off"
            name="display-username"
          />
          <Button
            onClick={handleSaveUsername}
            disabled={savingUsername || username === profile?.username}
            size="sm"
          >
            {savingUsername ? "Saving..." : "Save"}
          </Button>
        </div>
        {usernameMsg && (
          <p className={`text-sm ${usernameMsg.type === "error" ? "text-destructive-foreground" : "text-positive-foreground"}`}>
            {usernameMsg.text}
          </p>
        )}
      </section>

      {/* Email */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Email</h3>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <Button
            onClick={handleSaveEmail}
            disabled={savingEmail || email === user?.email}
            size="sm"
          >
            {savingEmail ? "Saving..." : "Save"}
          </Button>
        </div>
        {emailMsg && (
          <p className={`text-sm ${emailMsg.type === "error" ? "text-destructive-foreground" : "text-positive-foreground"}`}>
            {emailMsg.text}
          </p>
        )}
      </section>

      {/* Password */}
      <section className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Change Password</h3>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
        <Button
          onClick={handleSavePassword}
          disabled={savingPassword || !password}
          size="sm"
        >
          {savingPassword ? "Saving..." : "Update Password"}
        </Button>
        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.type === "error" ? "text-destructive-foreground" : "text-positive-foreground"}`}>
            {passwordMsg.text}
          </p>
        )}
      </section>

      {/* Delete Account */}
      <section className="space-y-2 pt-4 border-t">
        <h3 className="text-sm font-medium text-destructive-foreground">Delete Account</h3>
        <p className="text-sm text-muted-foreground">
          This action is permanent and cannot be undone. All your data will be deleted.
        </p>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          Delete Account
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and all associated data. Type{" "}
                <span className="font-semibold">delete my account</span> to confirm.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type 'delete my account'"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirm !== "delete my account" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------
// Preferences Tab
// ------------------------------------------------------------------
function PreferencesTab() {
  const { theme, setTheme } = useTheme();

  const options: { value: "light" | "dark" | "system"; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-lg">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Theme</h3>
        <div className="flex gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                theme === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Choose how the app looks to you. System will follow your device settings.
        </p>
      </section>
    </div>
  );
}

// ------------------------------------------------------------------
// Settings Page
// ------------------------------------------------------------------
export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="pt-4">
          <AccountTab />
        </TabsContent>

        <TabsContent value="preferences" className="pt-4">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
