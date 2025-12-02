import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WorkZone {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const WorkZonesManager = () => {
  const [zones, setZones] = useState<WorkZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<WorkZone | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_zones")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error al cargar zonas de trabajo");
    } else {
      setZones(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (zone?: WorkZone) => {
    if (zone) {
      setEditingZone(zone);
      setName(zone.name);
      setDescription(zone.description || "");
    } else {
      setEditingZone(null);
      setName("");
      setDescription("");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      if (editingZone) {
        const { error } = await supabase
          .from("work_zones")
          .update({ name: name.trim(), description: description.trim() || null })
          .eq("id", editingZone.id);

        if (error) throw error;
        toast.success("Zona actualizada");
      } else {
        const { error } = await supabase
          .from("work_zones")
          .insert({ name: name.trim(), description: description.trim() || null });

        if (error) throw error;
        toast.success("Zona creada");
      }

      setDialogOpen(false);
      loadZones();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar zona");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zone: WorkZone) => {
    if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) return;

    const { error } = await supabase
      .from("work_zones")
      .delete()
      .eq("id", zone.id);

    if (error) {
      toast.error("Error al eliminar zona");
    } else {
      toast.success("Zona eliminada");
      loadZones();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Zonas de Trabajo</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="zoneName">Nombre</Label>
                <Input
                  id="zoneName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Zona Norte"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoneDescription">Descripción (opcional)</Label>
                <Input
                  id="zoneDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción de la zona"
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Guardando..." : editingZone ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-muted-foreground">Cargando...</p>
        ) : zones.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No hay zonas de trabajo</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell className="text-muted-foreground">{zone.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(zone)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(zone)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkZonesManager;
