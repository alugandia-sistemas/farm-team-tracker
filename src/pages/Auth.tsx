import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSuccessfulAuth = async (userId: string) => {
    // Mark token as used
    const { error: updateError } = await supabase
      .from("invitation_tokens")
      .update({ 
        used: true, 
        used_by: userId 
      })
      .eq("token", invitationToken);

    if (updateError) {
      console.error("Error marking token as used:", updateError);
    }

    // Update profile with phone number
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
    await supabase
      .from("profiles")
      .update({ phone_number: formattedPhone })
      .eq("id", userId);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate invitation token
      const { data: tokenData, error: tokenError } = await supabase
        .from("invitation_tokens")
        .select("*")
        .eq("token", invitationToken)
        .eq("used", false)
        .maybeSingle();

      if (tokenError || !tokenData) {
        throw new Error("Token de invitación inválido o ya usado");
      }

      if (new Date(tokenData.expires_at) < new Date()) {
        throw new Error("El token de invitación ha expirado");
      }

      // Format phone number for Supabase (must start with +)
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

      // Para el número de demo, no enviar SMS real
      if (formattedPhone === "+34627535531") {
        toast.success("Usa el código: 123456");
        setStep("otp");
      } else {
        // Send OTP via SMS para otros números
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formattedPhone,
        });

        if (otpError) throw otpError;

        toast.success("¡OTP enviado a tu móvil!");
        setStep("otp");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al enviar OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;

      // Bypass para demo: si es el número de prueba y el código es 123456
      const isDemoBypass = formattedPhone === "+34627535531" && otp === "123456";
      
      if (isDemoBypass) {
        // Para el modo demo, usar email/password
        const demoEmail = "demo@trackera.app";
        const demoPassword = "DemoTrackera2024!";
        
        // Intentar login primero
        let { data, error } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        // Si no existe el usuario, crearlo
        if (error && error.message.includes("Invalid login credentials")) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                full_name: "Usuario Demo"
              }
            }
          });
          
          if (signUpError) throw signUpError;
          data = signUpData;
        } else if (error) {
          throw error;
        }

        if (data.user) {
          await handleSuccessfulAuth(data.user.id);
          toast.success("¡Autenticación exitosa!");
          navigate("/");
          return;
        }
      }

      // Flujo normal de OTP para otros números
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      // Completar autenticación exitosa
      if (data.user) {
        await handleSuccessfulAuth(data.user.id);
        toast.success("¡Autenticación exitosa!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Error al verificar OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Trackera</CardTitle>
          <CardDescription className="text-xl">
            Sistema de Gestión de Equipos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Móvil</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+34612345678"
                  required
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  Incluye el código de país (ej: +34 para España)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token de Invitación</Label>
                <Input
                  id="token"
                  type="text"
                  value={invitationToken}
                  onChange={(e) => setInvitationToken(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                  required
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Enviando..." : "Enviar OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Código OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  className="h-12 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Introduce el código que recibiste por SMS
                </p>
              </div>
              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? "Verificando..." : "Verificar OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                }}
              >
                Volver
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
