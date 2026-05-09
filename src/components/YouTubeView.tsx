import { useState, useEffect } from "react";
import { searchYouTube } from "@/lib/youtube";
import { Search, Play, Plus, Youtube, AlertCircle, MoreHorizontal, Shield, MessageSquare, ListPlus, BadgeCheck, Sparkles } from "lucide-react";
import { Track } from "@/types/music";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AdminSongEditor } from "./AdminSongEditor";
import { RequestAdminDialog } from "./RequestAdminDialog";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { AlbumDetailView } from "./AlbumDetailView";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function YouTubeView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [requestTrack, setRequestTrack] = useState<Track | null>(null);
  const [playlistTrack, setPlaylistTrack] = useState<Track | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [adminSongs, setAdminSongs] = useState<Map<string, { title: string; artist: string; cover_url: string | null }>>(new Map());
  
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = usePlayer();
  const { addTrack, tracks } = useLibrary();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // Fetch admin-edited songs to prioritize them
  useEffect(() => {
    async function fetchAdminSongs() {
      const { data } = await supabase
        .from("songs")
        .select("youtube_id, title, artist, cover_url")
        .not("youtube_id", "is", null);
      if (data) {
        const map = new Map<string, { title: string; artist: string; cover_url: string | null }>();
        data.forEach(s => {
          if (s.youtube_id) map.set(s.youtube_id, { title: s.title, artist: s.artist, cover_url: s.cover_url });
        });
        setAdminSongs(map);
      }
    }
    fetchAdminSongs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const searchResults = await searchYouTube(searchQuery);
      
      // If admin-edited version exists, replace YouTube data with admin data and deduplicate
      const seen = new Set<string>();
      const processed: Track[] = [];
      
      for (const track of searchResults) {
        const ytId = track.youtubeId;
        if (!ytId || seen.has(ytId)) continue;
        seen.add(ytId);
        
        const adminVersion = adminSongs.get(ytId);
        if (adminVersion) {
          processed.push({
            ...track,
            title: adminVersion.title,
            artist: adminVersion.artist,
            artwork: adminVersion.cover_url || track.artwork,
            isEdited: true,
          });
        } else {
          processed.push(track);
        }
      }
      
      setResults(processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlay = (track: Track) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pauseTrack();
      } else {
        resumeTrack();
      }
    } else {
      playTrack(track, results);
    }
  };

  const handleAddToLibrary = async (track: Track) => {
    if (tracks.some(t => t.youtubeId === track.youtubeId)) {
      toast({
        title: 'Already in library',
        description: 'This track is already in your library',
      });
      return;
    }

    await addTrack(track);
    toast({
      title: 'Added to library',
      description: `${track.title} has been added to your library`,
    });
  };

  const handleAdminEdit = (track: Track) => {
    setEditingTrack(track);
  };

  const handleSaveTrack = (updatedTrack: Track) => {
    setResults(prev => prev.map(t => 
      t.id === updatedTrack.id ? updatedTrack : t
    ));
    // Refresh admin songs cache
    if (updatedTrack.youtubeId) {
      setAdminSongs(prev => {
        const next = new Map(prev);
        next.set(updatedTrack.youtubeId!, { title: updatedTrack.title, artist: updatedTrack.artist, cover_url: updatedTrack.artwork || null });
        return next;
      });
    }
  };

  const verifiedResults = results.filter((t) => t.isEdited);
  const otherResults = results.filter((t) => !t.isEdited);
  const selectedAlbumTracks = selectedAlbum
    ? results.filter((track) => track.album.trim().toLowerCase() === selectedAlbum.trim().toLowerCase())
    : [];

  const renderRow = (track: Track, opts: { featured?: boolean }) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    const isCurrentlyPlaying = isCurrentTrack && isPlaying;
    const isInLibrary = tracks.some((t) => t.youtubeId === track.youtubeId);
    const featured = !!opts.featured;

    return (
      <div
        key={track.id}
        className={cn(
          "group relative flex items-center gap-3 md:gap-4 rounded-2xl transition-all duration-300",
          featured
            ? "p-4 md:p-5 glass-strong shadow-glow hover:-translate-y-0.5"
            : "p-3 md:p-4 hover:bg-secondary/50",
          isCurrentTrack && !featured && "bg-secondary/70"
        )}
      >
        {featured && (
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-brand opacity-25 blur-xl -z-10" />
        )}
        {/* Artwork */}
        <div
          className={cn(
            "relative flex-shrink-0 overflow-hidden rounded-xl",
            featured ? "h-20 w-20 md:h-24 md:w-24 shadow-lift" : "h-16 w-16"
          )}
        >
          <img
            src={track.artwork || "/placeholder.svg"}
            alt={track.album}
            className="h-full w-auto min-w-full object-cover object-center"
          />
          <button
            onClick={() => handlePlay(track)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div
              className={cn(
                "rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-glow",
                featured ? "h-11 w-11" : "h-8 w-8"
              )}
            >
              {isCurrentlyPlaying ? (
                <span className="eq-bars [&>span]:bg-white"><span /><span /><span /><span /></span>
              ) : (
                <Play className={cn(featured ? "h-5 w-5" : "h-4 w-4", "ml-0.5")} />
              )}
            </div>
          </button>
          {track.isEdited && (
            <div
              className="absolute -top-1 -left-1 rounded-full bg-gradient-brand p-1 shadow-glow"
              title="Verified by curator"
            >
              <BadgeCheck className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "font-semibold truncate",
                featured ? "text-base md:text-lg" : "text-sm md:text-base",
                isCurrentTrack && "text-accent"
              )}
            >
              {track.title}
            </p>
            {featured && <BadgeCheck className="h-4 w-4 text-accent flex-shrink-0" />}
          </div>
          <p className={cn("text-muted-foreground truncate", featured ? "text-sm" : "text-xs md:text-sm")}>
            {track.artist}
          </p>
        </div>

        <span className="hidden sm:block text-xs md:text-sm text-muted-foreground tabular-nums">
          {track.duration > 0 ? formatTime(track.duration) : "--:--"}
        </span>

        <button
          onClick={() => handleAddToLibrary(track)}
          disabled={isInLibrary}
          className={cn(
            "icon-button h-10 w-10 transition-opacity",
            isInLibrary ? "opacity-50 cursor-not-allowed" : "md:opacity-0 md:group-hover:opacity-100"
          )}
          title={isInLibrary ? "Already in library" : "Add to library"}
        >
          <Plus className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="icon-button h-10 w-10 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setPlaylistTrack(track)}>
              <ListPlus className="h-4 w-4 mr-2" />
              Add to Playlist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedAlbum(track.album)} disabled={!track.album}>
              <Youtube className="h-4 w-4 mr-2" />
              View Album
            </DropdownMenuItem>
            {isAdmin ? (
              <DropdownMenuItem onClick={() => handleAdminEdit(track)} className="text-accent">
                <Shield className="h-4 w-4 mr-2" />
                Admin Edit
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setRequestTrack(track)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Admin Change
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (selectedAlbum) {
    return (
      <AlbumDetailView
        albumName={selectedAlbum}
        tracks={selectedAlbumTracks}
        onBack={() => setSelectedAlbum(null)}
        onViewAlbum={(track) => setSelectedAlbum(track.album)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-8 py-6 border-b border-border/60">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow">
            <Youtube className="h-5 md:h-6 w-5 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient-animated inline-block">Search</h1>
            <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Discover tracks across YouTube and your verified library</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input pl-11 pr-24 focus-glow"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-gradient-brand text-white text-sm font-medium shadow-glow disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        {isSearching ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium">Search failed</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-brand rounded-full blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative h-20 w-20 rounded-full glass-strong flex items-center justify-center">
                <Youtube className="h-9 w-9 text-accent" />
              </div>
            </div>
            <p className="text-foreground font-semibold">Search YouTube for music</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Find and play any song from YouTube. Verified tracks appear at the top.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8">
            <p className="text-xs md:text-sm text-muted-foreground">
              {results.length} results for "{searchQuery}"
            </p>

            {verifiedResults.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h2 className="text-lg md:text-xl font-bold tracking-tight">Verified</h2>
                  <span className="text-xs text-muted-foreground">({verifiedResults.length})</span>
                </div>
                <div className="space-y-3">
                  {verifiedResults.map((track) => renderRow(track, { featured: true }))}
                </div>
              </section>
            )}

            {otherResults.length > 0 && (
              <section>
                {verifiedResults.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm md:text-base font-semibold uppercase tracking-wider text-muted-foreground">Other</h2>
                    <div className="flex-1 h-px bg-border/60" />
                    <span className="text-xs text-muted-foreground">{otherResults.length}</span>
                  </div>
                )}
                <div className="space-y-1">
                  {otherResults.map((track) => renderRow(track, { featured: false }))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingTrack && (
          <AdminSongEditor
            track={editingTrack}
            isOpen={!!editingTrack}
            onClose={() => setEditingTrack(null)}
            onSave={handleSaveTrack}
          />
        )}
      </AnimatePresence>

      {requestTrack && (
        <RequestAdminDialog
          track={requestTrack}
          isOpen={!!requestTrack}
          onClose={() => setRequestTrack(null)}
        />
      )}

      {playlistTrack && (
        <AddToPlaylistDialog
          track={playlistTrack}
          isOpen={!!playlistTrack}
          onClose={() => setPlaylistTrack(null)}
        />
      )}
    </div>
  );
}
