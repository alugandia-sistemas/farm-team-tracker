import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EntryModal = ({ open, onOpenChange, onSuccess }: EntryModalProps) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTeams();
    }
  }, [open]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error al cargar equipos");
    } else {
      setTeams(data || []);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .order("person_name");

    if (error) {
      toast.error("Error al cargar miembros");
    } else {
      setTeamMembers(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("time_records")
      .insert({
        team_id: selectedTeam,
        person_name: selectedPerson,
        entry_timestamp: now.toISOString(),
        work_location: workLocation,
        created_by: user?.id,
      });

    if (error) {
      toast.error("Error al registrar entrada");
    } else {
      toast.success(`Entrada registrada: ${format(now, "HH:mm")}`);
      setSelectedTeam("");
      setSelectedPerson("");
      setWorkLocation("");
      onSuccess();
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar Entrada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team">Equipo</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam} required>
              <SelectTrigger id="team" className="h-12">
                <SelectValue placeholder="Selecciona un equipo" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTeam && (
            <div className="space-y-2">
              <Label htmlFor="person">Persona</Label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson} required>
                <SelectTrigger id="person" className="h-12">
                  <SelectValue placeholder="Selecciona una persona" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.person_name}>
                      {member.person_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">¿Dónde trabajó?</Label>
            <Input
              id="location"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="Proyecto/Finca"
              required
              className="h-12"
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Guardando..." : "Registrar Entrada"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
