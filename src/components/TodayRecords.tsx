import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

export const TodayRecords = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayRecords();
  }, []);

  const loadTodayRecords = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("time_records")
      .select(`
        *,
        production (
          type,
          quantity
        )
      `)
      .gte("entry_timestamp", today.toISOString())
      .order("entry_timestamp", { ascending: false });

    if (error) {
      toast.error("Error al cargar registros");
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const calculateHours = (entry: string, exit: string | null) => {
    if (!exit) return "En curso";
    
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    const hours = differenceInHours(exitDate, entryDate);
    const minutes = differenceInMinutes(exitDate, entryDate) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return <Card><CardContent className="p-6">Cargando...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registros de Hoy</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No hay registros para hoy</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Persona</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Lugar</TableHead>
                  <TableHead>Producción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.person_name}</TableCell>
                    <TableCell>{format(new Date(record.entry_timestamp), "HH:mm")}</TableCell>
                    <TableCell>
                      {record.exit_timestamp 
                        ? format(new Date(record.exit_timestamp), "HH:mm")
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>{calculateHours(record.entry_timestamp, record.exit_timestamp)}</TableCell>
                    <TableCell>{record.work_location}</TableCell>
                    <TableCell>
                      {record.production && record.production.length > 0
                        ? `${record.production[0].quantity} ${record.production[0].type}`
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
