import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download } from "lucide-react";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, differenceInHours, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

const Reports = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("week");
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("all");

  useEffect(() => {
    checkAuth();
    loadTeams();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [dateRange, selectedTeam]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("name");
    
    setTeams(data || []);
  };

  const getDateRange = () => {
    const now = new Date();
    if (dateRange === "week") {
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    }
  };

  const loadRecords = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    let query = supabase
      .from("time_records")
      .select(`
        *,
        production (
          type,
          quantity
        )
      `)
      .gte("entry_timestamp", start.toISOString())
      .lte("entry_timestamp", end.toISOString())
      .order("entry_timestamp", { ascending: false });

    if (selectedTeam !== "all") {
      query = query.eq("team_id", selectedTeam);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar reportes");
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const calculateHours = (entry: string, exit: string | null) => {
    if (!exit) return 0;
    
    const entryDate = new Date(entry);
    const exitDate = new Date(exit);
    const totalMinutes = differenceInMinutes(exitDate, entryDate);
    
    return (totalMinutes / 60).toFixed(2);
  };

  const exportToCSV = () => {
    const headers = ["Fecha", "Persona", "Entrada", "Salida", "Horas", "Lugar", "Producción", "Tipo"];
    const rows = records.map(record => [
      format(new Date(record.entry_timestamp), "dd/MM/yyyy"),
      record.person_name,
      format(new Date(record.entry_timestamp), "HH:mm"),
      record.exit_timestamp ? format(new Date(record.exit_timestamp), "HH:mm") : "—",
      calculateHours(record.entry_timestamp, record.exit_timestamp),
      record.work_location,
      record.production && record.production.length > 0 ? record.production[0].quantity : "—",
      record.production && record.production.length > 0 ? record.production[0].type : "—",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${dateRange}_${format(new Date(), "ddMMyyyy")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Reporte descargado");
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
          <h1 className="text-2xl font-bold">Reportes</h1>
          <Button variant="secondary" onClick={exportToCSV} disabled={records.length === 0}>
            <Download className="mr-2 h-5 w-5" />
            Descargar CSV
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Equipos</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8">Cargando...</p>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay registros para el período seleccionado</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
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
                        <TableCell>{format(new Date(record.entry_timestamp), "dd/MM/yyyy")}</TableCell>
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
      </main>
    </div>
  );
};

export default Reports;
