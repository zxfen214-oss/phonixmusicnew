import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { preloadPlayerIcons } from "@/lib/preloadPlayerAssets";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { PlayerBar } from "@/components/PlayerBar";
import { HomeView } from "@/components/HomeView";
import { LibraryView } from "@/components/LibraryView";
import { PlaylistsView } from "@/components/PlaylistsView";
import { YouTubeView } from "@/components/YouTubeView";
import { LyricsView } from "@/components/LyricsView";
import MobilePlayer from "@/components/MobilePlayer";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Settings from "@/pages/Settings";

function AppContent() {
  const [activeView, setActiveView] = useState("home");
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMobilePlayer, setShowMobilePlayer] = useState(false);
  const { currentTrack } = usePlayer();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    preloadPlayerIcons();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-screen w-full items-center justify-center bg-background"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }

  // Render all views once and toggle visibility via CSS so switching tabs
  // doesn't unmount/remount (preserves scroll, queries, search state, etc.)
  const views: Array<{ id: string; node: JSX.Element }> = [
    { id: "home", node: <HomeView /> },
    { id: "library", node: <LibraryView /> },
    { id: "playlists", node: <PlaylistsView /> },
    { id: "youtube", node: <YouTubeView /> },
    { id: "settings", node: <Settings embedded /> },
  ];

  const handleOpenLyrics = () => {
    if (currentTrack) {
      setShowMobilePlayer(false);
      setShowLyrics(true);
    }
  };

  const handleOpenMobilePlayer = () => {
    if (currentTrack) {
      setShowMobilePlayer(true);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background pt-[env(safe-area-inset-top)]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {views.map((v) => {
            const active = (activeView === v.id) || (activeView === "home" && !views.find(x => x.id === activeView));
            return (
              <div
                key={v.id}
                className="absolute inset-0 overflow-hidden"
                style={{ display: activeView === v.id ? "block" : "none" }}
                aria-hidden={activeView !== v.id}
              >
                {v.node}
              </div>
            );
          })}
        </div>
        <PlayerBar onOpenLyrics={handleOpenLyrics} onOpenMobilePlayer={handleOpenMobilePlayer} />
      </div>
      <MobileNav activeView={activeView} onViewChange={setActiveView} />
      <MobilePlayer
        isOpen={showMobilePlayer}
        onClose={() => setShowMobilePlayer(false)}
        onOpenLyrics={handleOpenLyrics}
      />
      <AnimatePresence>
        {showLyrics && currentTrack && (
          <LyricsView onClose={() => setShowLyrics(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Index() {
  return (
    <PlayerProvider>
      <LibraryProvider>
        <AppContent />
      </LibraryProvider>
    </PlayerProvider>
  );
}
