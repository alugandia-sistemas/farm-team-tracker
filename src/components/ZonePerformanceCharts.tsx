import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { differenceInMinutes } from "date-fns";

interface ZonePerformanceChartsProps {
  records: any[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const ZonePerformanceCharts = ({ records }: ZonePerformanceChartsProps) => {
  const zoneStats = useMemo(() => {
    const stats: Record<string, { hours: number; production: number; records: number }> = {};

    records.forEach((record) => {
      const zone = record.work_location || "Sin zona";
      
      if (!stats[zone]) {
        stats[zone] = { hours: 0, production: 0, records: 0 };
      }

      // Calculate hours
      if (record.exit_timestamp) {
        const entryDate = new Date(record.entry_timestamp);
        const exitDate = new Date(record.exit_timestamp);
        const totalMinutes = differenceInMinutes(exitDate, entryDate);
        stats[zone].hours += totalMinutes / 60;
      }

      // Calculate production
      if (record.production && record.production.length > 0) {
        stats[zone].production += Number(record.production[0].quantity) || 0;
      }

      stats[zone].records += 1;
    });

    return Object.entries(stats).map(([zone, data]) => ({
      zone: zone.length > 15 ? zone.substring(0, 15) + "..." : zone,
      fullZone: zone,
      hours: Number(data.hours.toFixed(1)),
      production: Number(data.production.toFixed(1)),
      records: data.records,
      productivity: data.hours > 0 ? Number((data.production / data.hours).toFixed(2)) : 0,
    }));
  }, [records]);

  if (records.length === 0 || zoneStats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Hours by Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Horas por Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="zone" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                  className="fill-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="fill-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value} hrs`, "Horas"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullZone || label}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Production by Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Producción por Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="zone" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                  className="fill-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="fill-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value}`, "Producción"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullZone || label}
                />
                <Bar dataKey="production" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Productivity by Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimiento por Zona (Producción/Hora)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneStats} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="zone" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  tick={{ fontSize: 12 }}
                  className="fill-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="fill-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`${value}`, "Unidades/Hora"]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullZone || label}
                />
                <Bar dataKey="productivity" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de Registros por Zona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneStats}
                  dataKey="records"
                  nameKey="zone"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ zone, percent }) => `${zone} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {zoneStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [`${value} registros`, "Cantidad"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZonePerformanceCharts;
