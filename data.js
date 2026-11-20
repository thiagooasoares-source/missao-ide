// Todo o conteúdo editável do site fica aqui.
// Fotos: troque os "src" pelas fotos reais (caminho local, ex.: "fotos/mocambique-1.jpg", ou URL).
// iso2 = código de 2 letras do país (acha o país no globo e mostra a bandeira).

const MISSIONS = [
  {
    iso2: 'mz', name: 'Moçambique',
    summary: 'Igrejas locais, escola bíblica e apoio a famílias no interior do país.',
    photos: [
      { src: 'https://picsum.photos/seed/mz1/800/600', caption: 'Culto ao ar livre em Nampula.' },
      { src: 'https://picsum.photos/seed/mz2/800/600', caption: 'Distribuição de cestas básicas.' },
      { src: 'https://picsum.photos/seed/mz3/800/600', caption: 'Turma da escola bíblica.' },
    ],
  },
  {
    iso2: 'ao', name: 'Angola',
    summary: 'Plantação de igrejas e formação de líderes nas províncias do sul.',
    photos: [
      { src: 'https://picsum.photos/seed/ao1/800/600', caption: 'Batismo no rio Cunene.' },
      { src: 'https://picsum.photos/seed/ao2/800/600', caption: 'Encontro de pastores locais.' },
      { src: 'https://picsum.photos/seed/ao3/800/600', caption: 'Construção do templo em Lubango.' },
    ],
  },
  {
    iso2: 'in', name: 'Índia',
    summary: 'Casas de oração e alfabetização de crianças em vilarejos.',
    photos: [
      { src: 'https://picsum.photos/seed/in1/800/600', caption: 'Aula de alfabetização.' },
      { src: 'https://picsum.photos/seed/in2/800/600', caption: 'Casa de oração em Bihar.' },
      { src: 'https://picsum.photos/seed/in3/800/600', caption: 'Visita às famílias.' },
    ],
  },
  {
    iso2: 'pe', name: 'Peru',
    summary: 'Missão entre comunidades ribeirinhas da Amazônia peruana.',
    photos: [
      { src: 'https://picsum.photos/seed/pe1/800/600', caption: 'Barco missionário no rio Ucayali.' },
      { src: 'https://picsum.photos/seed/pe2/800/600', caption: 'Atendimento de saúde.' },
      { src: 'https://picsum.photos/seed/pe3/800/600', caption: 'Escola dominical.' },
    ],
  },
  {
    iso2: 'ht', name: 'Haiti',
    summary: 'Apoio a órfãos, água potável e reconstrução de casas.',
    photos: [
      { src: 'https://picsum.photos/seed/ht1/800/600', caption: 'Poço artesiano entregue.' },
      { src: 'https://picsum.photos/seed/ht2/800/600', caption: 'Crianças do orfanato.' },
      { src: 'https://picsum.photos/seed/ht3/800/600', caption: 'Mutirão de reconstrução.' },
    ],
  },
  {
    iso2: 'ph', name: 'Filipinas',
    summary: 'Evangelismo nas ilhas e discipulado de jovens.',
    photos: [
      { src: 'https://picsum.photos/seed/ph1/800/600', caption: 'Culto de jovens em Cebu.' },
      { src: 'https://picsum.photos/seed/ph2/800/600', caption: 'Viagem entre as ilhas.' },
      { src: 'https://picsum.photos/seed/ph3/800/600', caption: 'Grupo de discipulado.' },
    ],
  },
];

// Obras em andamento: cada item vira um card no carrossel "O que estamos construindo".
const PROJECTS = [
  {
    title: 'Casa missionária em Moçambique',
    text: 'Uma casa para receber missionários e famílias em Nampula: abrigo, base para o trabalho e lugar de comunhão.',
    image: 'https://picsum.photos/seed/casa/1200/700',
    total: 85000,
    raised: 52300,
  },
  {
    title: 'Templo em Lubango, Angola',
    text: 'Um lugar de culto para a igreja que hoje se reúne debaixo de uma árvore.',
    image: 'https://picsum.photos/seed/templo/1200/700',
    total: 120000,
    raised: 38400,
  },
  {
    title: 'Poço artesiano no Haiti',
    text: 'Água potável para 300 famílias e para o orfanato da missão.',
    image: 'https://picsum.photos/seed/poco/1200/700',
    total: 28000,
    raised: 24100,
  },
  {
    title: 'Barco missionário no Peru',
    text: 'Um barco para levar o Evangelho e atendimento de saúde às comunidades do rio Ucayali.',
    image: 'https://picsum.photos/seed/barco/1200/700',
    total: 64000,
    raised: 15700,
  },
];

// Exemplos: troque pela chave PIX real, pela imagem do QR code do seu banco e pelos links de checkout.
const PIX = {
  key: 'contato@missaoide.org',
  receiver: 'Missão Ide',
  qr: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=contato%40missaoide.org',
};

// O que cada contribuição dá acesso. tier = plano mínimo que inclui o benefício:
// 0 = PIX (qualquer valor), 1 = R$ 495, 2 = R$ 995, 3 = acima de R$ 995.
const BENEFITS = [
  { text: 'Acesso aos relatórios dos investimentos', tier: 0 },
  { text: 'Envie mensagens para os missionários', tier: 1 },
  { text: 'Participe dos grupos de notícias', tier: 1 },
  { text: 'Participe das lives de encontros', tier: 2 },
  { text: 'Participe das lives de ações', tier: 2 },
];

const PLANS = {
  p495: 'https://link.mercadopago.com.br/exemplo-495',
  p995: 'https://link.mercadopago.com.br/exemplo-995',
};

const WHATSAPP = '5511999999999'; // DDI + DDD + número, só dígitos
