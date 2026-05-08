import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { FileImportDialog } from "./FileImportDialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import {
  Home,
  Library,
  ListMusic,
  Search,
  Settings,
  Sun,
  Moon,
  Plus,
  LogOut,
  User,
  Shield,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, signOut } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const navigate = useNavigate();

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "playlists", label: "Playlists", icon: ListMusic },
    { id: "youtube", label: "Search", icon: Search },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const NavButton = ({
    active,
    onClick,
    icon: Icon,
    label,
    accent,
    delay = 0,
  }: {
    active?: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    accent?: boolean;
    delay?: number;
  }) => (
    <motion.button
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "text-foreground bg-accent/12"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
        accent && !active && "text-accent hover:text-accent"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-brand"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <Icon className={cn("h-5 w-5 transition-transform", active && "scale-110")} />
      <span>{label}</span>
    </motion.button>
  );

  return (
    <>
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl">
        {/* Logo */}
        <div className="flex h-16 items-center px-5">
          <Logo size="md" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item, index) => (
            <NavButton
              key={item.id}
              active={activeView === item.id}
              onClick={() => onViewChange(item.id)}
              icon={item.icon}
              label={item.label}
              delay={index * 0.04}
            />
          ))}

          <div className="pt-4 pb-1 px-3">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          <NavButton
            onClick={() => setShowImportDialog(true)}
            icon={Plus}
            label="Add Local Files"
            accent
            delay={0.18}
          />

          {isAdmin && (
            <NavButton
              onClick={() => navigate("/admin")}
              icon={Shield}
              label="Admin Panel"
              accent
              delay={0.22}
            />
          )}
        </nav>

        {/* User Section */}
        <div className="border-t border-border/60 p-3 space-y-1">
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1"
            >
              <div className="relative h-9 w-9 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-brand p-[1.5px]">
                  <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                    <User className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.email}</p>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-accent">
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <NavButton
            onClick={toggleTheme}
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? "Light mode" : "Dark mode"}
          />
          <NavButton
            onClick={() => navigate("/settings")}
            icon={Settings}
            label="Settings"
          />
          {canInstall && (
            <NavButton onClick={install} icon={Download} label="Install App" accent />
          )}

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive/90 hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <FileImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />
    </>
  );
}
