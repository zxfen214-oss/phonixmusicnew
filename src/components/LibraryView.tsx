import { useState, useMemo } from "react";
import { useLibrary } from "@/contexts/LibraryContext";
import { usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { TrackRow } from "./TrackRow";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { AdminSongEditor } from "./AdminSongEditor";
import { Search, SlidersHorizontal, Library as LibraryIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Track } from "@/types/music";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "recent" | "title" | "artist" | "album";
type FilterOption = "all" | "local" | "youtube";

export function LibraryView() {
  const { tracks, isLoading } = useLibrary();
  const cachedIds = useOfflineStatus();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const filteredAndSortedTracks = useMemo(() => {
    let filtered = [...tracks];

    if (filterBy === "local") {
      filtered = filtered.filter(t => t.source === "local");
    } else if (filterBy === "youtube") {
      filtered = filtered.filter(t => t.source === "youtube");
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.artist.toLowerCase().includes(query) ||
          t.album.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "artist":
        filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case "album":
        filtered.sort((a, b) => a.album.localeCompare(b.album));
        break;
      case "recent":
      default:
        filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }

    return filtered;
  }, [tracks, searchQuery, sortBy, filterBy]);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recent", label: "Recently Added" },
    { value: "title", label: "Title" },
    { value: "artist", label: "Artist" },
    { value: "album", label: "Album" },
  ];

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: "all", label: "All" },
    { value: "local", label: "Local" },
    { value: "youtube", label: "YouTube" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 px-4 md:px-8 py-6 space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-8 py-6 border-b border-border/60">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-animated inline-block">Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Everything you've saved in one place</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-11 focus-glow"
            />
          </div>

          <div className="flex items-center gap-1.5 glass rounded-full p-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterBy(option.value)}
                className={cn(
                  "px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200",
                  filterBy === option.value
                    ? "bg-gradient-brand text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-medium outline-none cursor-pointer focus-glow rounded"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-brand rounded-full blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative h-20 w-20 rounded-full glass-strong flex items-center justify-center">
                <LibraryIcon className="h-9 w-9 text-accent" />
              </div>
            </div>
            <p className="text-foreground text-lg font-semibold">Your library is empty</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Add songs from Search or import local files to start building your collection.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-4 px-6 md:px-12 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60">
              <div className="w-8 text-center">#</div>
              <div className="w-10" />
              <div className="flex-1">Title</div>
              <div className="hidden md:block w-48">Album</div>
              <div className="w-12 text-right">Time</div>
              <div className="w-8" />
            </div>

            <div className="px-4 md:px-8 py-2">
              {filteredAndSortedTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground">No tracks found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div>
                  {filteredAndSortedTracks.map((track, index) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={index}
                      tracks={filteredAndSortedTracks}
                      isOffline={!!track.youtubeId && cachedIds.has(track.youtubeId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {editingTrack && (
          <AdminSongEditor
            track={editingTrack}
            isOpen={!!editingTrack}
            onClose={() => setEditingTrack(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
