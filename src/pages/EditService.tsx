import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Camera,
  MapPin,
  DollarSign,
  FileText,
  Upload,
  X,
  Info,
  Loader2,
  ArrowLeft,
  Wand2,
  BarChart3,
  AlertTriangle,
  Tag,
  Percent,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useGenerateDescription } from "@/hooks/useGenerateDescription";
import { useContentModeration } from "@/hooks/useContentModeration";
import { usePriceSuggestion } from "@/hooks/usePriceSuggestion";
import { states, getCitiesByState } from "@/data/locations";
import { categoryConfig } from "@/data/categoryIcons";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceSuggestionPanel } from "@/components/PriceSuggestionPanel";
import { ServicePreview } from "@/components/ServicePreview";
import { ImageCropper } from "@/components/ImageCropper";
import { DraggableImageGrid } from "@/components/DraggableImageGrid";

const EditService = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { generateDescription, isGenerating } = useGenerateDescription();
  const { moderateServiceContent, isChecking: isModerating } =
    useContentModeration();
  const {
    suggestPrice,
    suggestion: priceSuggestion,
    isLoading: isPriceSuggesting,
    clearSuggestion,
  } = usePriceSuggestion();
  const [images, setImages] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState("active");
  
  // Discount fields
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountEndsAt, setDiscountEndsAt] = useState("");
  const [existingPromotionId, setExistingPromotionId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Anúncio não encontrado",
            description:
              "Este anúncio não existe ou você não tem permissão para editá-lo.",
            variant: "destructive",
          });
          navigate("/anunciar");
          return;
        }

        setTitle(data.title);
        setCategory(data.category);
        setSubcategory(data.subcategory || "");
        setDescription(data.description);
        setPrice(data.price.replace("R$ ", "").replace("A combinar", ""));
        setPriceType(data.price_type);
        setSelectedState(data.state);
        setSelectedCity(data.city);
        setImages(data.images || []);
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp || "");
        setStatus(data.status);
        
        // Fetch existing promotion for this service
        const { data: promotionData } = await supabase
          .from("service_promotions")
          .select("*")
          .eq("service_id", id)
          .eq("is_active", true)
          .gte("ends_at", new Date().toISOString())
          .maybeSingle();
        
        if (promotionData) {
          setHasDiscount(true);
          setDiscountPercentage(promotionData.discount_percentage?.toString() || "");
          setDiscountEndsAt(promotionData.ends_at.split("T")[0]);
          setExistingPromotionId(promotionData.id);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar os dados do anúncio.",
          variant: "destructive",
        });
        navigate("/anunciar");
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [id, navigate, toast]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create object URL and open cropper
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropperOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploadingImage(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer upload.",
          variant: "destructive",
        });
        return;
      }

      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("service-images").getPublicUrl(fileName);

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
      // Clean up the object URL
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop("");
      }
    }
  };

  const handleCropperClose = () => {
    setCropperOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !title ||
      !category ||
      !description ||
      (priceType !== "negotiable" && !price) ||
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
          description: "Você precisa estar logado para editar um serviço.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("services")
        .update({
          title,
          description,
          category,
          subcategory: subcategory || null,
          price: priceType === "negotiable" ? "A combinar" : `R$ ${price}`,
          price_type: priceType,
          state: selectedState,
          city: selectedCity,
          images,
          phone,
          whatsapp,
          status,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Handle promotion
      if (hasDiscount && price && discountPercentage && discountEndsAt) {
        const discountPercent = parseFloat(discountPercentage);
        const originalPrice = parseFloat(price);
        const promotionalPrice = originalPrice * (1 - discountPercent / 100);
        
        if (existingPromotionId) {
          // Update existing promotion
          await supabase
            .from("service_promotions")
            .update({
              discount_percentage: discountPercent,
              original_price: `R$ ${originalPrice.toFixed(2)}`,
              promotional_price: `R$ ${promotionalPrice.toFixed(2)}`,
              ends_at: new Date(discountEndsAt + "T23:59:59").toISOString(),
              is_active: true,
            })
            .eq("id", existingPromotionId);
        } else {
          // Create new promotion
          await supabase
            .from("service_promotions")
            .insert({
              service_id: id,
              professional_id: user.id,
              discount_percentage: discountPercent,
              original_price: `R$ ${originalPrice.toFixed(2)}`,
              promotional_price: `R$ ${promotionalPrice.toFixed(2)}`,
              ends_at: new Date(discountEndsAt + "T23:59:59").toISOString(),
              is_active: true,
            });
        }
      } else if (!hasDiscount && existingPromotionId) {
        // Deactivate existing promotion
        await supabase
          .from("service_promotions")
          .update({ is_active: false })
          .eq("id", existingPromotionId);
      }

      toast({
        title: "Anúncio atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });

      navigate("/anunciar");
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({
        title: "Erro ao atualizar",
        description:
          error.message || "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onClose={handleCropperClose}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        outputWidth={1280}
        title="Ajustar Foto do Serviço"
      />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <Skeleton className="h-10 w-48" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onClose={handleCropperClose}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        outputWidth={1280}
        title="Ajustar Foto do Serviço"
      />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/anunciar")}
            className="mb-4 hover:bg-primary hover:text-primary-foreground transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Meus Anúncios
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Editar Anúncio
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações do seu serviço.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Anúncio</CardTitle>
              <CardDescription>
                Defina se seu anúncio está ativo ou pausado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="w-2 h-2 p-0 rounded-full"
                      />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="paused">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="w-2 h-2 p-0 rounded-full"
                      />
                      Pausado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
                      <SelectValue
                        placeholder={
                          category
                            ? "Selecione uma subcategoria"
                            : "Selecione uma categoria primeiro"
                        }
                      />
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
                    className="gap-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
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
                  placeholder="Descreva detalhadamente o serviço que você oferece..."
                  className="min-h-[150px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  maxLength={500}
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Use o botão "Gerar com IA" para criar uma descrição
                    automaticamente.
                  </span>
                  <span
                    className={
                      description.length >= 450 ? "text-destructive" : ""
                    }
                  >
                    {description.length}/500
                  </span>
                </div>
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
            <CardContent>
              <DraggableImageGrid
                images={images}
                onReorder={setImages}
                onRemove={removeImage}
                onAddClick={handleImageClick}
                isUploading={uploadingImage}
                maxImages={5}
                fileInputRef={fileInputRef}
                onFileSelect={handleImageSelect}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-4">
                <Info className="w-3 h-3" />
                Adicione até 5 fotos. A primeira será a foto principal.
              </p>
            </CardContent>
          </Card>

          {/* Preço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Preço
              </CardTitle>
              <CardDescription>Defina o valor do seu serviço</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestPrice}
                  disabled={isPriceSuggesting || !category}
                  className="gap-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
                >
                  {isPriceSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {isPriceSuggesting ? "Analisando..." : "Sugerir preço"}
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="priceType">Tipo de Cobrança *</Label>
                  <Select
                    value={priceType}
                    onValueChange={(value) => {
                      setPriceType(value);
                      if (value === "negotiable") {
                        setPrice("");
                      }
                    }}
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
                <div className="space-y-2">
                  <Label htmlFor="price">Preço Base (R$) {priceType !== "negotiable" && "*"}</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder={priceType === "negotiable" ? "Não aplicável" : "0,00"}
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={priceType === "negotiable"}
                    required={priceType !== "negotiable"}
                    className={priceType === "negotiable" ? "bg-muted cursor-not-allowed" : ""}
                  />
                  {priceType === "negotiable" && (
                    <p className="text-xs text-muted-foreground">
                      O preço será definido via orçamento
                    </p>
                  )}
                </div>
              </div>
              
              {priceType === "negotiable" && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-600">Agendamento rápido indisponível</AlertTitle>
                  <AlertDescription className="text-amber-600/80">
                    Serviços com preço "A Combinar" não permitem agendamento rápido. Clientes precisarão entrar em contato para negociar valores e agendar o serviço através do chat.
                  </AlertDescription>
                </Alert>
              )}

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
              
              {/* Discount Section */}
              {priceType !== "negotiable" && price && (
                <div className="border-t pt-6 mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Tag className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Label htmlFor="hasDiscount" className="font-medium cursor-pointer">
                          Adicionar Desconto Promocional
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Atraia mais clientes com um preço promocional
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="hasDiscount"
                      checked={hasDiscount}
                      onCheckedChange={setHasDiscount}
                    />
                  </div>
                  
                  {hasDiscount && (
                    <div className="grid md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border border-dashed">
                      <div className="space-y-2">
                        <Label htmlFor="discountPercentage" className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          Desconto (%)
                        </Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          placeholder="Ex: 20"
                          min="1"
                          max="90"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discountEndsAt">Válido até</Label>
                        <Input
                          id="discountEndsAt"
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={discountEndsAt}
                          onChange={(e) => setDiscountEndsAt(e.target.value)}
                        />
                      </div>
                      
                      {discountPercentage && price && (
                        <div className="md:col-span-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Preço promocional:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm line-through text-muted-foreground">
                                R$ {parseFloat(price).toFixed(2)}
                              </span>
                              <Badge variant="default" className="text-base font-bold">
                                R$ {(parseFloat(price) * (1 - parseFloat(discountPercentage) / 100)).toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => navigate("/anunciar")}
            >
              Cancelar
            </Button>
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
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default EditService;
