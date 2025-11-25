import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: any;
  onSuccess: () => void;
}

export const EditTeamDialog = ({ open, onOpenChange, team, onSuccess }: EditTeamDialogProps) => {
  const [name, setName] = useState("");
  const [zoneFarm, setZoneFarm] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (team && open) {
      setName(team.name);
      setZoneFarm(team.zone_farm);
      setMembers(team.team_members || []);
    }
  }, [team, open]);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    const { error } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        person_name: newMemberName.trim(),
      });

    if (error) {
      toast.error("Error al agregar miembro");
    } else {
      toast.success("Miembro agregado");
      setNewMemberName("");
      loadMembers();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast.error("Error al eliminar miembro");
    } else {
      toast.success("Miembro eliminado");
      loadMembers();
    }
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", team.id);

    if (!error && data) {
      setMembers(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("teams")
      .update({
        name,
        zone_farm: zoneFarm,
      })
      .eq("id", team.id);

    if (error) {
      toast.error("Error al actualizar equipo");
    } else {
      toast.success("Equipo actualizado");
      onSuccess();
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Editar Equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre del Equipo</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-zone">Zona/Finca</Label>
            <Input
              id="edit-zone"
              value={zoneFarm}
              onChange={(e) => setZoneFarm(e.target.value)}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Miembros del Equipo</Label>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span>{member.person_name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Nombre del nuevo miembro"
                className="h-10"
              />
              <Button type="button" onClick={handleAddMember} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
