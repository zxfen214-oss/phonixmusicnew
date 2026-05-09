import { Home, Library, ListMusic, Search, Settings, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

interface MobileNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function MobileNav({ activeView, onViewChange }: MobileNavProps) {
  const { canInstall, install } = useInstallPrompt();

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "playlists", label: "Playlists", icon: ListMusic },
    { id: "youtube", label: "Search", icon: Search },
    ...(canInstall
      ? [{ id: "_install", label: "Install", icon: Download }]
      : [{ id: "settings", label: "Settings", icon: Settings }]),
  ];

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-40 safe-area-bottom md:hidden">
      <div className="glass-strong rounded-2xl shadow-lift">
        <div className="flex items-center justify-around px-1.5 py-1.5">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => (item.id === "_install" ? install() : onViewChange(item.id))}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl transition-colors",
                  isActive ? "text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-xl bg-gradient-brand shadow-glow transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="relative z-10 flex flex-col items-center gap-0.5">
                  <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
                  <span className={cn("text-[10px] font-semibold tracking-wide", !isActive && "opacity-80")}>
                    {item.label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
