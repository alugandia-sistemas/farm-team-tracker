import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(10);
  const [expirationDays, setExpirationDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedTokens, setGeneratedTokens] = useState<any[]>([]);

  const handleGenerateTokens = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tokens", {
        body: { quantity, expirationDays },
      });

      if (error) throw error;

      setGeneratedTokens(data.tokens);
      toast.success(`¡${quantity} tokens generados exitosamente!`);
    } catch (error: any) {
      toast.error(error.message || "Error al generar tokens");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (generatedTokens.length === 0) return;

    const headers = ["Token", "Fecha de Expiración"];
    const rows = generatedTokens.map(token => [
      token.token,
      new Date(token.expires_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tokens_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Tokens exportados a CSV");
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
          <h1 className="text-2xl font-bold">Administración de Tokens</h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generar Tokens de Invitación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad de Tokens</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  min={1}
                  max={100}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration">Días hasta Expiración</Label>
                <Input
                  id="expiration"
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  min={1}
                  max={365}
                  className="h-12"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleGenerateTokens} 
                  disabled={loading}
                  className="w-full h-12"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {loading ? "Generando..." : "Generar Tokens"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {generatedTokens.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tokens Generados ({generatedTokens.length})</CardTitle>
              <Button onClick={exportToCSV} variant="outline">
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Fecha de Expiración</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-mono font-bold">{token.token}</TableCell>
                        <TableCell>{new Date(token.expires_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">Disponible</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Admin;
