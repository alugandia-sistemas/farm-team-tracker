import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTeamDialog = ({ open, onOpenChange, onSuccess }: CreateTeamDialogProps) => {
  const [name, setName] = useState("");
  const [zoneFarm, setZoneFarm] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfiles();
    }
  }, [open]);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (!error && data) {
      setProfiles(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("teams")
      .insert({
        name,
        zone_farm: zoneFarm,
        responsible_id: responsibleId || null,
      });

    if (error) {
      toast.error("Error al crear equipo");
    } else {
      toast.success("Equipo creado exitosamente");
      setName("");
      setZoneFarm("");
      setResponsibleId("");
      onSuccess();
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crear Nuevo Equipo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Equipo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cuadrilla Norte"
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone">Zona/Finca</Label>
            <Input
              id="zone"
              value={zoneFarm}
              onChange={(e) => setZoneFarm(e.target.value)}
              placeholder="Ej: Finca La Esperanza"
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsable (Opcional)</Label>
            <Select value={responsibleId} onValueChange={setResponsibleId}>
              <SelectTrigger id="responsible" className="h-12">
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Creando..." : "Crear Equipo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
