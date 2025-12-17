import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  MapPin,
  FileText,
  Camera,
  Mail,
  Building2,
  Loader2,
  Eye,
  Edit,
  Calendar,
  Briefcase,
  Star,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { states, getCitiesByState } from "@/data/locations";
import { ImageCropper } from "@/components/ImageCropper";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_type: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

interface ProfileStats {
  servicesCount: number;
  averageRating: number;
  totalReviews: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    servicesCount: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    bio: "",
    account_type: "cliente",
    city: "",
    state: "",
  });

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = [
      formData.full_name,
      formData.phone,
      formData.bio,
      formData.city,
      formData.state,
      avatarUrl,
    ];
    const filledFields = fields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Erro ao carregar perfil",
          description: error.message,
          variant: "destructive",
        });
      }

      if (data) {
        setProfile(data);
        setAvatarUrl(data.avatar_url);
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          account_type: data.account_type || "cliente",
          city: data.city || "",
          state: data.state || "",
        });
      }

      // Fetch stats
      const { data: services } = await supabase
        .from("services")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "active");

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, service_id")
        .in("service_id", services?.map((s) => s.id) || []);

      const totalReviews = reviews?.length || 0;
      const averageRating =
        totalReviews > 0
          ? reviews!.reduce((acc, r) => acc + r.rating, 0) / totalReviews
          : 0;

      setStats({
        servicesCount: services?.length || 0,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
      });

      setLoading(false);
    };

    checkAuthAndLoadProfile();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        account_type: formData.account_type,
        city: formData.city,
        state: formData.state,
      })
      .eq("user_id", session.user.id);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.full_name,
              phone: formData.phone,
              bio: formData.bio,
              account_type: formData.account_type,
              city: formData.city,
              state: formData.state,
            }
          : null
      );
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    }

    setSaving(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropperOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploadingAvatar(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const userId = session.user.id;
      const fileName = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlWithCacheBuster })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBuster);
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi alterada com sucesso.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar foto",
        description: error.message || "Ocorreu um erro ao enviar a foto.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    }
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const getStateName = (stateValue: string) => {
    const state = states.find((s) => s.value === stateValue);
    return state?.label || stateValue;
  };

  const getCityName = (stateValue: string, cityValue: string) => {
    const cities = getCitiesByState(stateValue);
    const city = cities.find((c) => c.value === cityValue);
    return city?.label || cityValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">
            Carregando perfil...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Profile Card */}
          <Card className="overflow-hidden border-0 shadow-lg animate-fade-in">
            {/* Banner Gradient */}
            <div className="h-32 md:h-40 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdi02aDZ2Nmg2djZoLTZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
            </div>

            <CardContent className="relative pt-0 pb-6 px-4 md:px-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 -mt-16 md:-mt-20">
                {/* Avatar */}
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="relative">
                    <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl ring-4 ring-primary/20">
                      <AvatarImage
                        src={avatarUrl || ""}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-3xl md:text-4xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                        {getInitials(formData.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer disabled:cursor-wait"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Camera className="h-6 w-6 text-white" />
                          <span className="text-white text-xs font-medium">
                            Alterar
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-accent rounded-full border-4 border-background" />
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left md:pb-2 space-y-2">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                      {profile?.full_name ||
                        formData.full_name ||
                        "Complete seu perfil"}
                    </h1>
                    <Badge
                      variant={
                        formData.account_type === "profissional"
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        "text-xs px-3 py-1",
                        formData.account_type === "profissional" &&
                          "bg-accent text-accent-foreground"
                      )}
                    >
                      {formData.account_type === "profissional" ? (
                        <>
                          <Briefcase className="h-3 w-3 mr-1" /> Profissional
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" /> Cliente
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{email}</span>
                    </div>
                    {formData.city && formData.state && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">
                          {getCityName(formData.state, formData.city)},{" "}
                          {formData.state.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {profile?.created_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          Membro desde{" "}
                          {format(
                            new Date(profile.created_at),
                            "MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              {formData.account_type === "profissional" && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                      {stats.servicesCount}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      Serviços Ativos
                    </div>
                  </div>
                  <div className="text-center border-x border-border/50">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl md:text-3xl font-bold">
                        {stats.averageRating || "—"}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      Avaliação Média
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold">
                      {stats.totalReviews}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      Avaliações
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion Card */}
          {completionPercentage < 100 && (
            <Card
              className="border-primary/20 bg-primary/5 animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      completionPercentage >= 80
                        ? "bg-accent/20"
                        : "bg-yellow-500/20"
                    )}
                  >
                    {completionPercentage >= 80 ? (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        Complete seu perfil
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {completionPercentage}%
                      </span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {completionPercentage < 50 &&
                        "Adicione mais informações para aumentar sua visibilidade"}
                      {completionPercentage >= 50 &&
                        completionPercentage < 80 &&
                        "Você está quase lá! Continue preenchendo"}
                      {completionPercentage >= 80 &&
                        completionPercentage < 100 &&
                        "Excelente! Só faltam alguns detalhes"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Card */}
          <Tabs
            defaultValue="view"
            className="w-full animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50">
              <TabsTrigger
                value="view"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <Edit className="h-4 w-4" />
                Editar
              </TabsTrigger>
            </TabsList>

            {/* View Tab */}
            <TabsContent value="view" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Informações Pessoais</CardTitle>
                      <CardDescription>
                        Visualize suas informações de perfil
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Info Section */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Nome Completo
                      </p>
                      <p className="font-semibold text-lg">
                        {formData.full_name || (
                          <span className="text-muted-foreground italic font-normal">
                            Não informado
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        Telefone
                      </p>
                      <p className="font-semibold text-lg">
                        {formData.phone || (
                          <span className="text-muted-foreground italic font-normal">
                            Não informado
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Location Section */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-4 text-primary">
                      <MapPin className="h-4 w-4" />
                      Localização
                    </h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          Estado
                        </p>
                        <p className="font-semibold text-lg">
                          {formData.state ? (
                            getStateName(formData.state)
                          ) : (
                            <span className="text-muted-foreground italic font-normal">
                              Não informado
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="space-y-1.5 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          Cidade
                        </p>
                        <p className="font-semibold text-lg">
                          {formData.city ? (
                            getCityName(formData.state, formData.city)
                          ) : (
                            <span className="text-muted-foreground italic font-normal">
                              Não informado
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Bio Section */}
                  <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <FileText className="h-4 w-4" />
                      Sobre você
                    </h3>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {formData.bio || (
                          <span className="text-muted-foreground italic">
                            Nenhuma descrição adicionada
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="mt-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Edit className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Editar Perfil</CardTitle>
                      <CardDescription>
                        Atualize suas informações pessoais
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Info Section */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="full_name"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          Nome Completo
                        </Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Seu nome completo"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="(00) 00000-0000"
                          className="h-12"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Account Type */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Tipo de Conta
                      </Label>
                      <Select
                        value={formData.account_type}
                        onValueChange={(value) => {
                          setFormData({ ...formData, account_type: value });
                        }}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione o tipo de conta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Cliente - Busco serviços
                            </div>
                          </SelectItem>
                          <SelectItem value="profissional">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Profissional - Ofereço serviços
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Location Section */}
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-4 text-primary">
                        <MapPin className="h-4 w-4" />
                        Localização
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label
                            htmlFor="state"
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            Estado
                          </Label>
                          <Select
                            value={formData.state}
                            onValueChange={(value) => {
                              setFormData({
                                ...formData,
                                state: value,
                                city: "",
                              });
                            }}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem
                                  key={state.value}
                                  value={state.value}
                                >
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="city"
                            className="flex items-center gap-2 text-sm font-medium"
                          >
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            Cidade
                          </Label>
                          <Select
                            value={formData.city}
                            onValueChange={(value) => {
                              setFormData({ ...formData, city: value });
                            }}
                            disabled={!formData.state}
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue
                                placeholder={
                                  formData.state
                                    ? "Selecione a cidade"
                                    : "Selecione o estado primeiro"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {getCitiesByState(formData.state).map((city) => (
                                <SelectItem key={city.value} value={city.value}>
                                  {city.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Bio Section */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="bio"
                        className="flex items-center gap-2 text-sm font-medium"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Sobre você
                      </Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        placeholder="Conte um pouco sobre você, suas experiências e interesses..."
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta informação será exibida no seu perfil público.
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={saving}
                        className="min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {selectedImage && (
        <ImageCropper
          open={cropperOpen}
          onClose={handleCropperClose}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
};

export default Profile;
