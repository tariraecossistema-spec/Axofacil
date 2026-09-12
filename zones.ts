// Lista partilhada de zonas de Maputo usada tanto no formulário de
// criação de conta (AuthPage) como na edição de perfil da loja (Dashboard),
// para que ambos os locais ofereçam sempre as mesmas opções e para que
// futuras adições de zonas só precisem de ser feitas num único sítio.

export interface ZoneGroup {
  label: string;
  options: string[];
}

export const MAPUTO_ZONE_GROUPS: ZoneGroup[] = [
  {
    label: 'Maputo Cidade — Zona Cimento',
    options: [
      'Polana',
      'Sommerschield',
      'Costa do Sol',
      'Malhangalene',
      'Baixa da Cidade',
      'Alto Maé',
      'Coop',
      'Central'
    ]
  },
  {
    label: 'Maputo Cidade — Zonas Suburbanas',
    options: [
      'Xipamanine',
      'Chamanculo',
      'Mafalala',
      'Malanga',
      'Munhuana',
      'Polana Caniço',
      'Hulene',
      'Zimpeto',
      'Magoanine',
      'Laulane',
      'Jardim',
      'Ferroviário',
      'Aeroporto',
      'KaMpfumo',
      'KaMaxaquene',
      'Nlhamankulu',
      'KaMavota',
      'KaMubukwana',
      'KaTembe',
      'KaNyaka'
    ]
  },
  {
    label: 'Maputo Província',
    options: [
      'Matola',
      'Boane',
      'Marracuene',
      'Manhiça',
      'Namaacha',
      'Moamba'
    ]
  }
];

// Palavras-chave que, quando presentes na zona escolhida, indicam que o
// estabelecimento se situa na Província de Maputo em vez da Cidade de Maputo.
const PROVINCE_ZONE_KEYWORDS = ['matola', 'boane', 'marracuene', 'manhiça', 'manhica', 'namaacha', 'moamba', 'zimpeto', 'magoanine'];

export function inferProvinceFromZone(zone: string): string {
  const zLower = (zone || '').toLowerCase();
  const isProvincia = PROVINCE_ZONE_KEYWORDS.some(kw => zLower.includes(kw));
  return isProvincia ? 'Província de Maputo' : 'Cidade de Maputo';
}
