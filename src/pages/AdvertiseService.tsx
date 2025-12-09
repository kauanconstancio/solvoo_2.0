import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  CheckCircle2,
  Upload,
  X,
  Info,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  "Limpeza",
  "Fotografia",
  "Mecânica",
  "Encanamento",
  "Eletricista",
  "Pintura",
  "Jardinagem",
  "Mudanças",
  "Reformas",
  "Aulas Particulares",
  "Personal Trainer",
  "Beleza e Estética",
  "Eventos",
  "Tecnologia",
  "Outros",
];

const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const AdvertiseService = () => {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleImageUpload = () => {
    // Simula upload de imagem
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Serviço anunciado!",
      description:
        "Seu anúncio foi enviado para revisão e será publicado em breve.",
    });
  };

  return (
    <div className="min-h-screen ">
      <Header />

      <main className="container mx-auto px-4 py-8 ">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Novo Anúncio
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 ">
            Anuncie seu Serviço
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Preencha as informações abaixo para criar seu anúncio e começar a
            receber clientes hoje mesmo.
          </p>
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
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use um título claro e descritivo (máx. 100 caracteres)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
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
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceType">Tipo de Cobrança *</Label>
                  <Select required>
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
                Localização e Área de Atendimento
              </CardTitle>
              <CardDescription>
                Informe onde você atende seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input id="city" placeholder="Sua cidade" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" placeholder="Seu bairro (opcional)" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceArea">Área de Atendimento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o raio de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Até 5 km</SelectItem>
                    <SelectItem value="10">Até 10 km</SelectItem>
                    <SelectItem value="20">Até 20 km</SelectItem>
                    <SelectItem value="50">Até 50 km</SelectItem>
                    <SelectItem value="city">Toda a cidade</SelectItem>
                    <SelectItem value="state">Todo o estado</SelectItem>
                  </SelectContent>
                </Select>
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
                  <a href="#" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  da plataforma. Confirmo que as informações fornecidas são
                  verdadeiras.
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="submit" size="lg" className="flex-1 py-3">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Publicar Anúncio
                </Button>
                <Button type="button" variant="outline" size="lg">
                  Salvar Rascunho
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Seu anúncio será revisado e publicado em até 24 horas.
              </p>
            </CardContent>
          </Card>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default AdvertiseService;
