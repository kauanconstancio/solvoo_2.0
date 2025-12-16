import { useState, useRef } from "react";
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
  Wand2,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGenerateDescription } from "@/hooks/useGenerateDescription";
import { useContentModeration } from "@/hooks/useContentModeration";
import { usePriceSuggestion } from "@/hooks/usePriceSuggestion";
import { states, getCitiesByState } from "@/data/locations";
import { categoryConfig } from "@/data/categoryIcons";
import { supabase } from "@/integrations/supabase/client";
import MyServices from "@/components/MyServices";
import { PriceSuggestionPanel } from "@/components/PriceSuggestionPanel";
import { ServicePreview } from "@/components/ServicePreview";

const AdvertiseService = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateDescription, isGenerating } = useGenerateDescription();
  const { moderateServiceContent, isChecking: isModerating } = useContentModeration();
  const { suggestPrice, suggestion: priceSuggestion, isLoading: isPriceSuggesting, clearSuggestion } = usePriceSuggestion();
  const [images, setImages] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleGenerateDescription = async () => {
    const generated = await generateDescription(title, category, subcategory);
    if (generated) {
      setDescription(generated);
    }
  };

  const handleSuggestPrice = async () => {
    await suggestPrice(category, subcategory, selectedState, selectedCity);
  };

  const handleApplyPrice = (suggestedPrice: number) => {
    setPrice(suggestedPrice.toString());
    clearSuggestion();
  };

  const handleImageClick = () => {
    if (images.length >= 5) {
      toast({
        title: "Limite atingido",
        description: "Você pode adicionar no máximo 5 imagens.",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer upload.",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("service-images")
        .getPublicUrl(fileName);

      setImages((prev) => [...prev, publicUrl]);

      toast({
        title: "Imagem adicionada",
        description: "Sua imagem foi enviada com sucesso.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

    if (images.length === 0) {
      toast({
        title: "Imagem obrigatória",
        description: "Adicione pelo menos uma foto do seu serviço.",
        variant: "destructive",
      });
      return;
    }

    if (
      !title ||
      !category ||
      !description ||
      !price ||
      !priceType ||
      !selectedState ||
      !selectedCity
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Moderation check
      const moderationResult = await moderateServiceContent(title, description);
      if (!moderationResult.approved) {
        setIsSubmitting(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

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
        subcategory: subcategory || null,
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
        description:
          error.message ||
          "Ocorreu um erro ao criar seu anúncio. Tente novamente.",
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
            <TabsTrigger
              value="my-services"
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Meus Anúncios
            </TabsTrigger>
            <TabsTrigger
              value="new-service"
              className="flex items-center gap-2"
            >
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

            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto space-y-8"
            >
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={category}
                        onValueChange={(value) => {
                          setCategory(value);
                          setSubcategory("");
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryConfig.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategoria</Label>
                      <Select
                        value={subcategory}
                        onValueChange={setSubcategory}
                        disabled={!category}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={category ? "Selecione uma subcategoria" : "Selecione uma categoria primeiro"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryConfig
                            .find((c) => c.value === category)
                            ?.subcategories?.map((sub) => (
                              <SelectItem key={sub} value={sub}>
                                {sub}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Descrição do Serviço *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={isGenerating || !title || !category}
                        className="gap-2"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="h-4 w-4" />
                        )}
                        {isGenerating ? "Gerando..." : "Gerar com IA"}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente o serviço que você oferece, sua experiência, diferenciais e o que está incluso..."
                      className="min-h-[150px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                      maxLength={500}
                      required
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Use o botão "Gerar com IA" para criar uma descrição automaticamente.</span>
                      <span className={description.length >= 450 ? "text-destructive" : ""}>{description.length}/500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fotos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Fotos do Serviço *
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
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleImageClick}
                          disabled={uploadingImage}
                          className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6" />
                          )}
                          <span className="text-xs">
                            {uploadingImage ? "Enviando..." : "Adicionar"}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Adicione pelo menos 1 foto (máx. 5). A primeira será a foto principal do
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
                  <CardDescription>
                    Defina o valor do seu serviço
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="price">Preço Base (R$) *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSuggestPrice}
                          disabled={isPriceSuggesting || !category}
                          className="gap-2"
                        >
                          {isPriceSuggesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <BarChart3 className="h-4 w-4" />
                          )}
                          {isPriceSuggesting ? "Analisando..." : "Sugerir preço"}
                        </Button>
                      </div>
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
                      <Select
                        value={priceType}
                        onValueChange={setPriceType}
                        required
                      >
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

                  {/* Price Suggestion Panel */}
                  {priceSuggestion?.suggestion && (
                    <PriceSuggestionPanel
                      suggestion={priceSuggestion.suggestion}
                      insight={priceSuggestion.insight}
                      servicesAnalyzed={priceSuggestion.servicesAnalyzed}
                      currentPrice={price}
                      onApplyPrice={handleApplyPrice}
                      onClose={clearSuggestion}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Localização */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Localização
                  </CardTitle>
                  <CardDescription>Informe onde você atende</CardDescription>
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
                          <SelectValue
                            placeholder={
                              selectedState
                                ? "Selecione a cidade"
                                : "Selecione o estado primeiro"
                            }
                          />
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
                      <a
                        href="/termos"
                        className="text-primary hover:underline"
                      >
                        Termos de Uso
                      </a>{" "}
                      e a{" "}
                      <a
                        href="/privacidade"
                        className="text-primary hover:underline"
                      >
                        Política de Privacidade
                      </a>{" "}
                      da plataforma. Confirmo que as informações fornecidas são
                      verdadeiras.
                    </Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <ServicePreview
                      title={title}
                      description={description}
                      category={category}
                      subcategory={subcategory}
                      price={price}
                      priceType={priceType}
                      state={selectedState}
                      city={selectedCity}
                      images={images}
                      disabled={!title && !description && images.length === 0}
                    />
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
