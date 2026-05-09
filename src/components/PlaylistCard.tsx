import { useState } from "react";
import { Playlist } from "@/types/music";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { Play, MoreHorizontal, Trash2, ListMusic } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface PlaylistCardProps {
  playlist: Playlist;
  onOpen?: () => void;
}

export function PlaylistCard({ playlist, onOpen }: PlaylistCardProps) {
  const { playTrack } = usePlayer();
  const { removePlaylist } = useLibrary();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const firstTrackArtwork = playlist.tracks[0]?.artwork;
  const trackCount = playlist.tracks.length;

  const handlePlay = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleOpen = () => {
    if (onOpen) onOpen();
    else handlePlay();
  };

  const handleDelete = async () => {
    try {
      await removePlaylist(playlist.id);
      toast({
        title: "Playlist deleted",
        description: `"${playlist.name}" has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete playlist.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <motion.div 
        className="group relative cursor-pointer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Artwork */}
        <div className="relative mb-3" onClick={handleOpen}>
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary shadow-soft transition-shadow duration-300 group-hover:shadow-lift">
            {firstTrackArtwork ? (
              <img
                src={firstTrackArtwork}
                alt={playlist.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-brand-soft">
                <ListMusic className="h-12 w-12 text-foreground/40" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          
          {/* Play Button Overlay */}
          {playlist.tracks.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-gradient-brand text-white flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-glow"
            >
              <Play className="h-5 w-5 ml-0.5 fill-current" />
            </motion.button>
          )}
        </div>

        {/* Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0" onClick={handleOpen}>
            <h3 className="font-medium truncate text-sm">{playlist.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {trackCount} {trackCount === 1 ? "track" : "tracks"}
            </p>
          </div>
          
          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="icon-button h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{playlist.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The playlist will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
