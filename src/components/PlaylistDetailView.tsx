import { Playlist } from "@/types/music";
import { Track } from "@/types/music";
import { usePlayer } from "@/contexts/PlayerContext";
import { TrackRow } from "./TrackRow";
import { ArrowLeft, Play, Shuffle, ListMusic } from "lucide-react";

interface Props {
  playlist: Playlist;
  onBack: () => void;
  onViewAlbum?: (track: Track) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PlaylistDetailView({ playlist, onBack, onViewAlbum }: Props) {
  const { playTrack } = usePlayer();
  const tracks = playlist.tracks;
  const cover = tracks[0]?.artwork;

  const handlePlayAll = () => {
    if (tracks.length > 0) playTrack(tracks[0], tracks);
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = shuffleArray(tracks);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 md:px-8 py-5 border-b border-border/60 flex items-center gap-3">
        <button
          onClick={onBack}
          className="icon-button h-9 w-9 flex-shrink-0"
          aria-label="Back to playlists"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{playlist.name}</h1>
          <p className="text-xs text-muted-foreground">
            {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start sm:items-end mb-6">
          <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-2xl overflow-hidden shadow-lift bg-secondary flex-shrink-0">
            {cover ? (
              <img src={cover} alt={playlist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-brand-soft">
                <ListMusic className="h-16 w-16 text-foreground/40" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePlayAll}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-brand text-white font-medium text-sm shadow-glow disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              Play
            </button>
            <button
              onClick={handleShuffle}
              disabled={tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong font-medium text-sm disabled:opacity-50"
            >
              <Shuffle className="h-4 w-4" />
              Shuffle
            </button>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>This playlist is empty.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} tracks={tracks} onViewAlbum={onViewAlbum} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}