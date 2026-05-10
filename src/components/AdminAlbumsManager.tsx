import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Disc3, Loader2, Plus, Save, Search, X } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  cover_url: string | null;
}

interface AdminAlbumsManagerProps {
  songs: Song[];
  onChanged: () => void;
}

export function AdminAlbumsManager({ songs, onChanged }: AdminAlbumsManagerProps) {
  const { toast } = useToast();
  const [editingAlbum, setEditingAlbum] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const albums = useMemo(() => {
    const map = new Map<string, Song[]>();
    for (const s of songs) {
      if (!s.album) continue;
      const arr = map.get(s.album) ?? [];
      arr.push(s);
      map.set(s.album, arr);
    }
    return Array.from(map.entries())
      .map(([name, list]) => ({
        name,
        tracks: list,
        cover: list.find((t) => t.cover_url)?.cover_url ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.album ?? "").toLowerCase().includes(q),
    );
  }, [songs, search]);

  const startCreate = () => {
    setIsCreating(true);
    setEditingAlbum(null);
    setDraftName("");
    setSelected(new Set());
    setSearch("");
  };

  const startEdit = (name: string) => {
    setEditingAlbum(name);
    setIsCreating(false);
    setDraftName(name);
    setSelected(new Set(songs.filter((s) => s.album === name).map((s) => s.id)));
    setSearch("");
  };

  const cancel = () => {
    setEditingAlbum(null);
    setIsCreating(false);
    setDraftName("");
    setSelected(new Set());
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    const name = draftName.trim();
    if (!name) {
      toast({ title: "Album name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // If editing an existing album, first clear album from songs that
      // were removed from the selection.
      if (editingAlbum) {
        const previouslyIn = songs.filter((s) => s.album === editingAlbum).map((s) => s.id);
        const toClear = previouslyIn.filter((id) => !selected.has(id));
        if (toClear.length > 0) {
          const { error } = await supabase.from("songs").update({ album: null }).in("id", toClear);
          if (error) throw error;
        }
      }
      // Assign album name to all selected songs.
      if (selected.size > 0) {
        const { error } = await supabase
          .from("songs")
          .update({ album: name })
          .in("id", Array.from(selected));
        if (error) throw error;
      }
      toast({ title: editingAlbum ? "Album updated" : "Album created", description: name });
      cancel();
      onChanged();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteAlbum = async (name: string) => {
    if (!confirm(`Remove album "${name}"? Songs will be kept but unassigned.`)) return;
    const ids = songs.filter((s) => s.album === name).map((s) => s.id);
    if (ids.length === 0) return;
    const { error } = await supabase.from("songs").update({ album: null }).in("id", ids);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Album removed", description: name });
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Group existing songs into albums. Listeners can open an album from the song menu.
        </p>
        {!isCreating && !editingAlbum && (
          <Button size="sm" onClick={startCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New album
          </Button>
        )}
      </div>

      {(isCreating || editingAlbum) && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="album-name" className="text-xs">Album name</Label>
              <Input
                id="album-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Midnights"
                className="bg-background"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={cancel} className="mt-5">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search songs to add…"
                className="pl-9 bg-background"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {filteredSongs.length === 0 && (
                <div className="px-3 py-4 text-xs text-muted-foreground">No songs match.</div>
              )}
              {filteredSongs.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/40 cursor-pointer">
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.artist}
                      {s.album && s.album !== draftName && ` · in "${s.album}"`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{selected.size} song{selected.size === 1 ? "" : "s"} selected</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingAlbum ? "Save changes" : "Create album"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {albums.length === 0 && !isCreating && (
          <div className="text-center py-12 text-muted-foreground">
            <Disc3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No albums yet. Create one to group your songs.</p>
          </div>
        )}
        {albums.map((album) => (
          <div key={album.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
              {album.cover ? (
                <img src={album.cover} alt={album.name} className="h-full w-full object-cover" />
              ) : (
                <Disc3 className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{album.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {album.tracks.length} {album.tracks.length === 1 ? "track" : "tracks"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => startEdit(album.name)}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={() => deleteAlbum(album.name)} className="text-destructive">Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}