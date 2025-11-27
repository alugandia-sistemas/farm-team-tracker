import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, LogOut, Users, FileText, Settings } from "lucide-react";
import { toast } from "sonner";
import { EntryModal } from "@/components/EntryModal";
import { ExitModal } from "@/components/ExitModal";
import { TodayRecords } from "@/components/TodayRecords";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  const handleEntrySuccess = () => {
    setShowEntryModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleExitSuccess = () => {
    setShowExitModal(false);
    setRefreshKey(prev => prev + 1);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-foreground text-primary rounded-lg flex items-center justify-center font-bold text-xl">
              T
            </div>
            <h1 className="text-2xl font-bold">Trackera</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary" 
              onClick={() => navigate("/teams")}
              className="hidden sm:flex"
            >
              <Users className="mr-2 h-5 w-5" />
              Equipos
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate("/reports")}
              className="hidden sm:flex"
            >
              <FileText className="mr-2 h-5 w-5" />
              Reportes
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate("/admin")}
              className="hidden sm:flex"
            >
              <Settings className="mr-2 h-5 w-5" />
              Admin
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Main Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer bg-accent hover:bg-accent/90" onClick={() => setShowEntryModal(true)}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-accent-foreground/10 rounded-full flex items-center justify-center">
                <LogIn className="w-10 h-10 text-accent-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-accent-foreground">REGISTRAR ENTRADA</h2>
              <p className="text-accent-foreground/80">Registra el inicio de jornada</p>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-shadow cursor-pointer bg-primary hover:bg-primary/90" onClick={() => setShowExitModal(true)}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-primary-foreground/10 rounded-full flex items-center justify-center">
                <LogOut className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-primary-foreground">REGISTRAR SALIDA</h2>
              <p className="text-primary-foreground/80">Registra el fin de jornada</p>
            </div>
          </Card>
        </div>

        {/* Mobile Navigation Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:hidden">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/teams")}
            className="h-14"
          >
            <Users className="mr-2 h-5 w-5" />
            Equipos
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/reports")}
            className="h-14"
          >
            <FileText className="mr-2 h-5 w-5" />
            Reportes
          </Button>
        </div>

        {/* Today's Records */}
        <TodayRecords key={refreshKey} />
      </main>

      <EntryModal 
        open={showEntryModal} 
        onOpenChange={setShowEntryModal}
        onSuccess={handleEntrySuccess}
      />
      <ExitModal 
        open={showExitModal} 
        onOpenChange={setShowExitModal}
        onSuccess={handleExitSuccess}
      />
    </div>
  );
};

export default Dashboard;
