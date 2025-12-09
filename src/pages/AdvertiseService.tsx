import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  MapPin,
  DollarSign,
  FileText,
  CheckCircle2,
  Upload,
  X,
  Info,
  Sparkles,
  Loader2,
  Plus,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { states, getCitiesByState } from "@/data/locations";
import { serviceCategories } from "@/data/services";
import { supabase } from "@/integrations/supabase/client";
import MyServices from "@/components/MyServices";

const AdvertiseService = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleImageUpload = () => {
    if (images.length < 5) {
      setImages([...images, `/placeholder.svg`]);
      toast({
        title: "Imagem adicionada",
        description: "Sua imagem foi adicionada com sucesso.",
      });
    } else {
      toast({
        title: "Limite atingido",
        description: "Você pode adicionar no máximo 5 imagens.",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!title || !category || !description || !price || !priceType || !selectedState || !selectedCity) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para anunciar um serviço.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("services").insert({
        user_id: user.id,
        title,
        description,
        category,
        price: `R$ ${price}`,
        price_type: priceType,
        state: selectedState,
        city: selectedCity,
        images,
        phone,
        whatsapp,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Serviço anunciado!",
        description: "Seu anúncio foi publicado com sucesso.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast({
        title: "Erro ao criar anúncio",
        description: error.message || "Ocorreu um erro ao criar seu anúncio. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <Header />

      <main className="container mx-auto px-4 py-8 ">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 ">
            Gerenciar Anúncios
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Crie novos anúncios ou gerencie seus serviços publicados.
          </p>
        </div>

        <Tabs defaultValue="my-services" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="my-services" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              Meus Anúncios
            </TabsTrigger>
            <TabsTrigger value="new-service" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Anúncio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-services">
            <MyServices />
          </TabsContent>

          <TabsContent value="new-service">
            <div className="text-center mb-8">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="w-3 h-3 mr-1" />
                Novo Anúncio
              </Badge>
            </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Descreva seu serviço de forma clara e objetiva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Anúncio *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Limpeza Residencial Completa com Produtos Inclusos"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use um título claro e descritivo (máx. 100 caracteres)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Serviço *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o serviço que você oferece, sua experiência, diferenciais e o que está incluso..."
                  className="min-h-[150px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Seja detalhista! Uma boa descrição aumenta suas chances de
                  contratação.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Fotos do Serviço
              </CardTitle>
              <CardDescription>
                Adicione fotos do seu trabalho para atrair mais clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg border border-border overflow-hidden group"
                  >
                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <Badge className="absolute bottom-2 left-2 text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                ))}
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Adicionar</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Adicione até 5 fotos. A primeira será a foto principal do
                anúncio.
              </p>
            </CardContent>
          </Card>

          {/* Preço e Disponibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Preço
              </CardTitle>
              <CardDescription>Defina o valor do seu serviço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Base (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceType">Tipo de Cobrança *</Label>
                  <Select value={priceType} onValueChange={setPriceType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Preço Fixo</SelectItem>
                      <SelectItem value="hour">Por Hora</SelectItem>
                      <SelectItem value="day">Por Diária</SelectItem>
                      <SelectItem value="project">Por Projeto</SelectItem>
                      <SelectItem value="negotiable">A Combinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Localização e Contato
              </CardTitle>
              <CardDescription>
                Informe onde você atende e como os clientes podem te contatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select 
                    value={selectedState} 
                    onValueChange={(value) => {
                      setSelectedState(value);
                      setSelectedCity("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Select 
                    value={selectedCity} 
                    onValueChange={setSelectedCity}
                    disabled={!selectedState}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getCitiesByState(selectedState).map((city) => (
                        <SelectItem key={city.value} value={city.value}>
                          {city.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input 
                    id="whatsapp" 
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termos e Submissão */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3 mb-6">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setAcceptTerms(checked as boolean)
                  }
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  Li e aceito os{" "}
                  <a href="/termos" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a href="/privacidade" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  da plataforma. Confirmo que as informações fornecidas são
                  verdadeiras.
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1 py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Publicar Anúncio
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Seu anúncio será publicado imediatamente após a submissão.
              </p>
            </CardContent>
          </Card>
        </form>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdvertiseService;
