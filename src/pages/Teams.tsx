import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus } from "lucide-react";
import { CreateTeamDialog } from "@/components/CreateTeamDialog";
import { TeamCard } from "@/components/TeamCard";
import { toast } from "sonner";

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    checkAuth();
    loadTeams();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select(`
        *,
        team_members (*)
      `)
      .order("name");

    if (error) {
      toast.error("Error al cargar equipos");
    } else {
      setTeams(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="secondary" 
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Equipos</h1>
          <Button variant="secondary" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Equipo
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card>
            <CardContent className="p-6">Cargando...</CardContent>
          </Card>
        ) : teams.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No hay equipos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crea tu primer equipo para comenzar a registrar horas de trabajo.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Crear Primer Equipo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} onUpdate={loadTeams} />
            ))}
          </div>
        )}
      </main>

      <CreateTeamDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadTeams}
      />
    </div>
  );
};

export default Teams;
