import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ExitModal = ({ open, onOpenChange, onSuccess }: ExitModalProps) => {
  const [openRecords, setOpenRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState("");
  const [productionType, setProductionType] = useState("");
  const [productionQuantity, setProductionQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadOpenRecords();
    }
  }, [open]);

  const loadOpenRecords = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("time_records")
      .select("*")
      .is("exit_timestamp", null)
      .gte("entry_timestamp", today.toISOString())
      .order("entry_timestamp", { ascending: false });

    if (error) {
      toast.error("Error al cargar registros");
    } else {
      setOpenRecords(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date();
    const record = openRecords.find(r => r.id === selectedRecord);

    if (!record) {
      toast.error("Registro no encontrado");
      setLoading(false);
      return;
    }

    // Update time record with exit timestamp
    const { error: updateError } = await supabase
      .from("time_records")
      .update({ exit_timestamp: now.toISOString() })
      .eq("id", selectedRecord);

    if (updateError) {
      toast.error("Error al registrar salida");
      setLoading(false);
      return;
    }

    // Add production record if provided
    if (productionQuantity && productionType) {
      const { error: prodError } = await supabase
        .from("production")
        .insert({
          time_record_id: selectedRecord,
          type: productionType,
          quantity: parseFloat(productionQuantity),
        });

      if (prodError) {
        toast.error("Error al registrar producción");
      }
    }

    toast.success(`Salida registrada: ${format(now, "HH:mm")}`);
    setSelectedRecord("");
    setProductionType("");
    setProductionQuantity("");
    onSuccess();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Registrar Salida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person">Persona</Label>
            <Select value={selectedRecord} onValueChange={setSelectedRecord} required>
              <SelectTrigger id="person" className="h-12">
                <SelectValue placeholder="Selecciona una persona" />
              </SelectTrigger>
              <SelectContent>
                {openRecords.map((record) => (
                  <SelectItem key={record.id} value={record.id}>
                    {record.person_name} - Entrada: {format(new Date(record.entry_timestamp), "HH:mm")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRecord && (
            <>
              <div className="space-y-2">
                <Label htmlFor="production-type">Tipo de Producción (Opcional)</Label>
                <Select value={productionType} onValueChange={setProductionType}>
                  <SelectTrigger id="production-type" className="h-12">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cajas">Cajas</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="Metros">Metros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {productionType && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad Producida</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={productionQuantity}
                    onChange={(e) => setProductionQuantity(e.target.value)}
                    placeholder="Cantidad"
                    className="h-12"
                  />
                </div>
              )}
            </>
          )}

          <Button type="submit" className="w-full h-12" disabled={loading || !selectedRecord}>
            {loading ? "Guardando..." : "Registrar Salida"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
