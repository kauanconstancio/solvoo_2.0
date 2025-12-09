export interface City {
  value: string;
  label: string;
}

export interface State {
  value: string;
  label: string;
  cities: City[];
}

export const states: State[] = [
  {
    value: "AC",
    label: "Acre",
    cities: [
      { value: "rio-branco", label: "Rio Branco" },
      { value: "cruzeiro-do-sul", label: "Cruzeiro do Sul" },
      { value: "sena-madureira", label: "Sena Madureira" },
    ],
  },
  {
    value: "AL",
    label: "Alagoas",
    cities: [
      { value: "maceio", label: "Maceió" },
      { value: "arapiraca", label: "Arapiraca" },
      { value: "palmeira-dos-indios", label: "Palmeira dos Índios" },
    ],
  },
  {
    value: "AP",
    label: "Amapá",
    cities: [
      { value: "macapa", label: "Macapá" },
      { value: "santana", label: "Santana" },
      { value: "laranjal-do-jari", label: "Laranjal do Jari" },
    ],
  },
  {
    value: "AM",
    label: "Amazonas",
    cities: [
      { value: "manaus", label: "Manaus" },
      { value: "parintins", label: "Parintins" },
      { value: "itacoatiara", label: "Itacoatiara" },
    ],
  },
  {
    value: "BA",
    label: "Bahia",
    cities: [
      { value: "salvador", label: "Salvador" },
      { value: "feira-de-santana", label: "Feira de Santana" },
      { value: "vitoria-da-conquista", label: "Vitória da Conquista" },
      { value: "camacari", label: "Camaçari" },
      { value: "itabuna", label: "Itabuna" },
    ],
  },
  {
    value: "CE",
    label: "Ceará",
    cities: [
      { value: "fortaleza", label: "Fortaleza" },
      { value: "caucaia", label: "Caucaia" },
      { value: "juazeiro-do-norte", label: "Juazeiro do Norte" },
      { value: "maracanau", label: "Maracanaú" },
      { value: "sobral", label: "Sobral" },
    ],
  },
  {
    value: "DF",
    label: "Distrito Federal",
    cities: [
      { value: "brasilia", label: "Brasília" },
      { value: "ceilandia", label: "Ceilândia" },
      { value: "taguatinga", label: "Taguatinga" },
    ],
  },
  {
    value: "ES",
    label: "Espírito Santo",
    cities: [
      { value: "vitoria", label: "Vitória" },
      { value: "vila-velha", label: "Vila Velha" },
      { value: "serra", label: "Serra" },
      { value: "cariacica", label: "Cariacica" },
    ],
  },
  {
    value: "GO",
    label: "Goiás",
    cities: [
      { value: "goiania", label: "Goiânia" },
      { value: "aparecida-de-goiania", label: "Aparecida de Goiânia" },
      { value: "anapolis", label: "Anápolis" },
      { value: "rio-verde", label: "Rio Verde" },
    ],
  },
  {
    value: "MA",
    label: "Maranhão",
    cities: [
      { value: "sao-luis", label: "São Luís" },
      { value: "imperatriz", label: "Imperatriz" },
      { value: "caxias", label: "Caxias" },
      { value: "timon", label: "Timon" },
    ],
  },
  {
    value: "MT",
    label: "Mato Grosso",
    cities: [
      { value: "cuiaba", label: "Cuiabá" },
      { value: "varzea-grande", label: "Várzea Grande" },
      { value: "rondonopolis", label: "Rondonópolis" },
      { value: "sinop", label: "Sinop" },
    ],
  },
  {
    value: "MS",
    label: "Mato Grosso do Sul",
    cities: [
      { value: "campo-grande", label: "Campo Grande" },
      { value: "dourados", label: "Dourados" },
      { value: "tres-lagoas", label: "Três Lagoas" },
      { value: "corumba", label: "Corumbá" },
    ],
  },
  {
    value: "MG",
    label: "Minas Gerais",
    cities: [
      { value: "belo-horizonte", label: "Belo Horizonte" },
      { value: "uberlandia", label: "Uberlândia" },
      { value: "contagem", label: "Contagem" },
      { value: "juiz-de-fora", label: "Juiz de Fora" },
      { value: "betim", label: "Betim" },
      { value: "montes-claros", label: "Montes Claros" },
    ],
  },
  {
    value: "PA",
    label: "Pará",
    cities: [
      { value: "belem", label: "Belém" },
      { value: "ananindeua", label: "Ananindeua" },
      { value: "santarem", label: "Santarém" },
      { value: "maraba", label: "Marabá" },
    ],
  },
  {
    value: "PB",
    label: "Paraíba",
    cities: [
      { value: "joao-pessoa", label: "João Pessoa" },
      { value: "campina-grande", label: "Campina Grande" },
      { value: "santa-rita", label: "Santa Rita" },
      { value: "patos", label: "Patos" },
    ],
  },
  {
    value: "PR",
    label: "Paraná",
    cities: [
      { value: "curitiba", label: "Curitiba" },
      { value: "londrina", label: "Londrina" },
      { value: "maringa", label: "Maringá" },
      { value: "ponta-grossa", label: "Ponta Grossa" },
      { value: "cascavel", label: "Cascavel" },
      { value: "foz-do-iguacu", label: "Foz do Iguaçu" },
    ],
  },
  {
    value: "PE",
    label: "Pernambuco",
    cities: [
      { value: "recife", label: "Recife" },
      { value: "jaboatao-dos-guararapes", label: "Jaboatão dos Guararapes" },
      { value: "olinda", label: "Olinda" },
      { value: "caruaru", label: "Caruaru" },
      { value: "petrolina", label: "Petrolina" },
    ],
  },
  {
    value: "PI",
    label: "Piauí",
    cities: [
      { value: "teresina", label: "Teresina" },
      { value: "parnaiba", label: "Parnaíba" },
      { value: "picos", label: "Picos" },
    ],
  },
  {
    value: "RJ",
    label: "Rio de Janeiro",
    cities: [
      { value: "rio-de-janeiro", label: "Rio de Janeiro" },
      { value: "sao-goncalo", label: "São Gonçalo" },
      { value: "duque-de-caxias", label: "Duque de Caxias" },
      { value: "nova-iguacu", label: "Nova Iguaçu" },
      { value: "niteroi", label: "Niterói" },
      { value: "campos-dos-goytacazes", label: "Campos dos Goytacazes" },
      { value: "petropolis", label: "Petrópolis" },
    ],
  },
  {
    value: "RN",
    label: "Rio Grande do Norte",
    cities: [
      { value: "natal", label: "Natal" },
      { value: "mossoro", label: "Mossoró" },
      { value: "parnamirim", label: "Parnamirim" },
    ],
  },
  {
    value: "RS",
    label: "Rio Grande do Sul",
    cities: [
      { value: "porto-alegre", label: "Porto Alegre" },
      { value: "caxias-do-sul", label: "Caxias do Sul" },
      { value: "canoas", label: "Canoas" },
      { value: "pelotas", label: "Pelotas" },
      { value: "santa-maria", label: "Santa Maria" },
      { value: "gravatal", label: "Gravataí" },
    ],
  },
  {
    value: "RO",
    label: "Rondônia",
    cities: [
      { value: "porto-velho", label: "Porto Velho" },
      { value: "ji-parana", label: "Ji-Paraná" },
      { value: "ariquemes", label: "Ariquemes" },
    ],
  },
  {
    value: "RR",
    label: "Roraima",
    cities: [
      { value: "boa-vista", label: "Boa Vista" },
      { value: "rorainopolis", label: "Rorainópolis" },
    ],
  },
  {
    value: "SC",
    label: "Santa Catarina",
    cities: [
      { value: "florianopolis", label: "Florianópolis" },
      { value: "joinville", label: "Joinville" },
      { value: "blumenau", label: "Blumenau" },
      { value: "sao-jose", label: "São José" },
      { value: "chapeco", label: "Chapecó" },
      { value: "criciuma", label: "Criciúma" },
    ],
  },
  {
    value: "SP",
    label: "São Paulo",
    cities: [
      { value: "sao-paulo", label: "São Paulo" },
      { value: "guarulhos", label: "Guarulhos" },
      { value: "campinas", label: "Campinas" },
      { value: "sao-bernardo-do-campo", label: "São Bernardo do Campo" },
      { value: "santo-andre", label: "Santo André" },
      { value: "osasco", label: "Osasco" },
      { value: "ribeirao-preto", label: "Ribeirão Preto" },
      { value: "sorocaba", label: "Sorocaba" },
      { value: "santos", label: "Santos" },
      { value: "sao-jose-dos-campos", label: "São José dos Campos" },
    ],
  },
  {
    value: "SE",
    label: "Sergipe",
    cities: [
      { value: "aracaju", label: "Aracaju" },
      { value: "nossa-senhora-do-socorro", label: "Nossa Senhora do Socorro" },
      { value: "lagarto", label: "Lagarto" },
    ],
  },
  {
    value: "TO",
    label: "Tocantins",
    cities: [
      { value: "palmas", label: "Palmas" },
      { value: "araguaina", label: "Araguaína" },
      { value: "gurupi", label: "Gurupi" },
    ],
  },
];

// Helper functions
export const getStateByValue = (value: string): State | undefined => {
  return states.find((state) => state.value === value);
};

export const getCitiesByState = (stateValue: string): City[] => {
  const state = getStateByValue(stateValue);
  return state?.cities || [];
};

export const getAllCities = (): City[] => {
  return states.flatMap((state) => state.cities);
};

export const getStateLabel = (value: string): string => {
  return getStateByValue(value)?.label || value;
};

export const getCityLabel = (stateValue: string, cityValue: string): string => {
  const cities = getCitiesByState(stateValue);
  return cities.find((city) => city.value === cityValue)?.label || cityValue;
};
