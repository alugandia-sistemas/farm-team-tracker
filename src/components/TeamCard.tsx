import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users } from "lucide-react";
import { EditTeamDialog } from "./EditTeamDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface TeamCardProps {
  team: any;
  onUpdate: () => void;
}

export const TeamCard = ({ team, onUpdate }: TeamCardProps) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", team.id);

    if (error) {
      toast.error("Error al eliminar equipo");
    } else {
      toast.success("Equipo eliminado");
      onUpdate();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{team.name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowEdit(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Zona: {team.zone_farm}
          </p>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2" />
            <span>{team.team_members?.length || 0} miembros</span>
          </div>
        </CardContent>
      </Card>

      <EditTeamDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        team={team}
        onSuccess={onUpdate}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los miembros y registros asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
