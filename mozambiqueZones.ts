/**
 * Dicionário abrangente de Zonas, Bairros e Avenidas de Maputo e Matola
 * com Coordenadas GPS de Alta Precisão para o Axofácil Moçambique.
 */

export interface MozambiqueZone {
  name: string;
  municipality: 'Cidade de Maputo' | 'Matola' | 'Boane' | 'Outro';
  district?: string;
  lat: number;
  lng: number;
  keywords: string[];
}

export const MOZAMBIQUE_ZONES: MozambiqueZone[] = [
  // ==========================================
  // CIDADE DE MAPUTO - DISTRITO KA MPHUMO (ZONA URBANA CENTRAL)
  // ==========================================
  {
    name: 'Polana Cimento A',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9723,
    lng: 32.5934,
    keywords: ['polana', 'polana cimento', 'polana a', 'julius nyerere', 'kenneth kaunda']
  },
  {
    name: 'Polana Cimento B',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9664,
    lng: 32.5852,
    keywords: ['polana b', 'vladimir lenine', 'milano', 'kim il sung']
  },
  {
    name: 'Central A (Baixa de Maputo)',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9720,
    lng: 32.5732,
    keywords: ['central', 'baixa', '25 de setembro', 'samora machel', 'praca dos trabalhadores', 'porto']
  },
  {
    name: 'Central B (Mercado Central / Museu)',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9685,
    lng: 32.5750,
    keywords: ['central b', 'mercado central', '24 de julho', 'eduardo mondlane']
  },
  {
    name: 'Central C (Karl Marx / Ho Chi Min)',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9620,
    lng: 32.5710,
    keywords: ['central c', 'karl marx', 'ho chi min']
  },
  {
    name: 'Alto Maé A',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9610,
    lng: 32.5645,
    keywords: ['alto mae', 'alto mae a', 'avenida de mocambique', 'praca 18 de maio']
  },
  {
    name: 'Alto Maé B',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9575,
    lng: 32.5600,
    keywords: ['alto mae b', 'rua dos irmas', 'estrada velha']
  },
  {
    name: 'Malhangalene A',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9550,
    lng: 32.5790,
    keywords: ['malhangalene', 'malhangalene a', 'marien ngouabi', 'acordos de lusaka']
  },
  {
    name: 'Malhangalene B',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9520,
    lng: 32.5840,
    keywords: ['malhangalene b', 'cinema venezuela']
  },
  {
    name: 'Sommerschield 1',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9605,
    lng: 32.5960,
    keywords: ['sommerschield', 'sommerschield 1', 'hospital central', 'uem']
  },
  {
    name: 'Sommerschield 2 (Clube Marítimo / UEM Nova)',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9510,
    lng: 32.6020,
    keywords: ['sommerschield 2', 'sommerschield ii', 'uem nova', 'maritimo']
  },
  {
    name: 'Coop',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9580,
    lng: 32.5880,
    keywords: ['coop', 'bairro coop', 'vladimir lenine coop']
  },

  // ==========================================
  // CIDADE DE MAPUTO - DISTRITO KA MAXAKENI
  // ==========================================
  {
    name: 'Polana Caniço A',
    municipality: 'Cidade de Maputo',
    district: 'KaMaxakeni',
    lat: -25.9450,
    lng: 32.5920,
    keywords: ['polana canico', 'polana canico a', 'rua da resistencia']
  },
  {
    name: 'Polana Caniço B',
    municipality: 'Cidade de Maputo',
    district: 'KaMaxakeni',
    lat: -25.9380,
    lng: 32.5970,
    keywords: ['polana canico b', 'estrada circular']
  },
  {
    name: 'Maxaquene A & B',
    municipality: 'Cidade de Maputo',
    district: 'KaMaxakeni',
    lat: -25.9460,
    lng: 32.5760,
    keywords: ['maxaquene', 'maxaquene a', 'maxaquene b', 'praca dos combatentes', 'xiquelene']
  },
  {
    name: 'Urbanização',
    municipality: 'Cidade de Maputo',
    district: 'KaMaxakeni',
    lat: -25.9420,
    lng: 32.5710,
    keywords: ['urbanizacao', 'bairro urbanizacao']
  },
  {
    name: 'Mafalala',
    municipality: 'Cidade de Maputo',
    district: 'KaMaxakeni',
    lat: -25.9480,
    lng: 32.5650,
    keywords: ['mafalala', 'cravo', 'eusebio', 'museu mafalala']
  },

  // ==========================================
  // CIDADE DE MAPUTO - DISTRITO KA MAVOTA (ORLA E EXPANSÃO NORTE)
  // ==========================================
  {
    name: 'Costa do Sol',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9180,
    lng: 32.6280,
    keywords: ['costa do sol', 'praia da costa do sol', 'marginal', 'dona alice']
  },
  {
    name: 'Triunfo (Triunfo Novo & Velho)',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9310,
    lng: 32.6210,
    keywords: ['triunfo', 'triunfo novo', 'triunfo velho', 'baia mall', 'aquapark']
  },
  {
    name: 'Mavalane A & B',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9230,
    lng: 32.5780,
    keywords: ['mavalane', 'mavalane a', 'mavalane b', 'hospital geral de mavalane', 'aeroporto']
  },
  {
    name: 'FPLM / Aeroporto',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9200,
    lng: 32.5710,
    keywords: ['fplm', 'aeroporto', 'aeroporto internacional', 'bairro aeroporto']
  },
  {
    name: 'Hulene A & B',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9120,
    lng: 32.5850,
    keywords: ['hulene', 'hulene a', 'hulene b']
  },
  {
    name: 'Laulane',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9050,
    lng: 32.6110,
    keywords: ['laulane', 'estrada circular laulane']
  },
  {
    name: 'Albasine',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.8850,
    lng: 32.6150,
    keywords: ['albasine', 'estrada circular albasine', 'vila olimpica']
  },

  // ==========================================
  // CIDADE DE MAPUTO - DISTRITO KA MUBUKWANA
  // ==========================================
  {
    name: 'Zimpeto (Estádio & Mercado Grossista)',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.8450,
    lng: 32.5650,
    keywords: ['zimpeto', 'estadio nacional', 'estadio do zimpeto', 'mercado grossista do zimpeto', 'vila olimpica']
  },
  {
    name: 'Bagamoyo',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.8870,
    lng: 32.5590,
    keywords: ['bagamoyo', 'en1 bagamoyo']
  },
  {
    name: 'George Dimitrov (Benfica)',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.8980,
    lng: 32.5530,
    keywords: ['benfica', 'george dimitrov', 'paragem benfica']
  },
  {
    name: '25 de Junho (A & B)',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.9180,
    lng: 32.5480,
    keywords: ['25 de junho', 'bairro 25 de junho', 'choupal']
  },
  {
    name: 'Jardim',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.9380,
    lng: 32.5520,
    keywords: ['jardim', 'paragem jardim', 'praca 16 de junho']
  },
  {
    name: 'Luís Cabral',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.9450,
    lng: 32.5410,
    keywords: ['luis cabral', 'ponte maputo katembe norte']
  },

  // ==========================================
  // CIDADE DE MAPUTO - DISTRITO KA NLHAMANKULU
  // ==========================================
  {
    name: 'Chamanculo (A, B, C, D)',
    municipality: 'Cidade de Maputo',
    district: 'KaNlhamankulu',
    lat: -25.9520,
    lng: 32.5540,
    keywords: ['chamanculo', 'chamanculo a', 'chamanculo b', 'chamanculo c', 'chamanculo d']
  },
  {
    name: 'Xipamanine',
    municipality: 'Cidade de Maputo',
    district: 'KaNlhamankulu',
    lat: -25.9420,
    lng: 32.5600,
    keywords: ['xipamanine', 'mercado do xipamanine', 'praca dos combatentes']
  },
  {
    name: 'Minkadjuine & Malanga',
    municipality: 'Cidade de Maputo',
    district: 'KaNlhamankulu',
    lat: -25.9610,
    lng: 32.5520,
    keywords: ['malanga', 'minkadjuine']
  },

  // ==========================================
  // CIDADE DE MAPUTO - KA TEMBE
  // ==========================================
  {
    name: 'KaTembe Centro & Guachene',
    municipality: 'Cidade de Maputo',
    district: 'KaTembe',
    lat: -25.9980,
    lng: 32.5650,
    keywords: ['katembe', 'catembe', 'guachene', 'chali', 'ponte katembe']
  },

  // ==========================================
  // MUNICÍPIO DA MATOLA (POSTO MATOLA-SEDE)
  // ==========================================
  {
    name: 'Matola A (Matola Centro / Vila)',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9620,
    lng: 32.4630,
    keywords: ['matola a', 'matola centro', 'vila da matola', 'camara municipal da matola', 'parque dos poetas']
  },
  {
    name: 'Matola B',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9540,
    lng: 32.4710,
    keywords: ['matola b', 'museu da matola']
  },
  {
    name: 'Matola C',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9450,
    lng: 32.4650,
    keywords: ['matola c', 'hospital provincial da matola']
  },
  {
    name: 'Matola D & E',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9380,
    lng: 32.4580,
    keywords: ['matola d', 'matola e']
  },
  {
    name: 'Matola F, G, H & J',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9250,
    lng: 32.4510,
    keywords: ['matola f', 'matola g', 'matola h', 'matola j', 'matola 700']
  },
  {
    name: 'Fomento',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9520,
    lng: 32.4850,
    keywords: ['fomento', 'bairro do fomento', 'matola fomento']
  },
  {
    name: 'Liberdade',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9450,
    lng: 32.4920,
    keywords: ['liberdade', 'bairro liberdade', 'paragem liberdade']
  },
  {
    name: 'Matola Rio (Mozal & Beluluane)',
    municipality: 'Matola',
    district: 'Matola-Sede',
    lat: -25.9480,
    lng: 32.4180,
    keywords: ['matola rio', 'mozal', 'beluluane', 'parque industrial']
  },

  // ==========================================
  // MUNICÍPIO DA MATOLA (POSTO MACHAVA)
  // ==========================================
  {
    name: 'Machava Sede',
    municipality: 'Matola',
    district: 'Machava',
    lat: -25.9180,
    lng: 32.4890,
    keywords: ['machava', 'machava sede', 'estacao da machava', 'estadio da machava']
  },
  {
    name: 'Machava Socimol & km 15',
    municipality: 'Matola',
    district: 'Machava',
    lat: -25.9020,
    lng: 32.4780,
    keywords: ['socimol', 'machava km 15', 'km 15', 'cruzamento machava']
  },
  {
    name: 'Bunhiça',
    municipality: 'Matola',
    district: 'Machava',
    lat: -25.8890,
    lng: 32.4920,
    keywords: ['bunhica', 'bairro bunhica', 'machava bunhica']
  },
  {
    name: 'Trevo da Machava / EN4',
    municipality: 'Matola',
    district: 'Machava',
    lat: -25.9320,
    lng: 32.4980,
    keywords: ['trevo', 'trevo da machava', 'en4 trevo', 'shoprite machava']
  },
  {
    name: 'São Damanso',
    municipality: 'Matola',
    district: 'Machava',
    lat: -25.9080,
    lng: 32.5050,
    keywords: ['sao damanso', 'machava sao damanso']
  },

  // ==========================================
  // MUNICÍPIO DA MATOLA (POSTO INFULENE)
  // ==========================================
  {
    name: 'Infulene & Vale do Infulene',
    municipality: 'Matola',
    district: 'Infulene',
    lat: -25.8950,
    lng: 32.5250,
    keywords: ['infulene', 'vale do infulene', 'machava infulene']
  },
  {
    name: 'T3',
    municipality: 'Matola',
    district: 'Infulene',
    lat: -25.8880,
    lng: 32.5350,
    keywords: ['t3', 'paragem t3', 'terminal t3']
  },
  {
    name: 'Khongolote & Singatela',
    municipality: 'Matola',
    district: 'Infulene',
    lat: -25.8650,
    lng: 32.5150,
    keywords: ['khongolote', 'singatela', 'bairro singatela']
  },

  // ==========================================
  // BOANE
  // ==========================================
  {
    name: 'Boane Vila & Estaleiros',
    municipality: 'Boane',
    lat: -26.0420,
    lng: 32.3280,
    keywords: ['boane', 'vila de boane', 'rio umbeluzi', 'estaleiros de boane']
  }
];

/**
 * Normaliza uma string de texto removendo acentos, cedilhas e espaços em excesso.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Localiza as coordenadas exatas de uma zona ou bairro de Maputo / Matola.
 * Procura por correspondência direta de nome, palavras-chave e sinónimos.
 */
export function findMozambiqueZoneCoordinates(query: string): { lat: number; lng: number; matchedZone: MozambiqueZone } | null {
  if (!query || !query.trim()) return null;

  const cleanQ = normalizeText(query);

  // 1. Correspondência exata no nome da zona
  const exact = MOZAMBIQUE_ZONES.find(z => normalizeText(z.name) === cleanQ);
  if (exact) {
    return { lat: exact.lat, lng: exact.lng, matchedZone: exact };
  }

  // 2. Correspondência se a query contiver o nome da zona
  const nameMatch = MOZAMBIQUE_ZONES.find(z => {
    const cleanName = normalizeText(z.name);
    return cleanQ.includes(cleanName) || cleanName.includes(cleanQ);
  });
  if (nameMatch) {
    return { lat: nameMatch.lat, lng: nameMatch.lng, matchedZone: nameMatch };
  }

  // 3. Correspondência em qualquer uma das palavras-chave da zona
  const keywordMatch = MOZAMBIQUE_ZONES.find(z =>
    z.keywords.some(kw => {
      const cleanKw = normalizeText(kw);
      return cleanQ.includes(cleanKw) || cleanKw.includes(cleanQ);
    })
  );
  if (keywordMatch) {
    return { lat: keywordMatch.lat, lng: keywordMatch.lng, matchedZone: keywordMatch };
  }

  return null;
}
