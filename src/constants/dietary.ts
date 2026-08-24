export interface DietaryCategory {
  id: string;
  title: string;
  subtitle: string;
  colorClass: string;
  bgColorClass: string;
  badgeBg: string;
  options: DietaryOption[];
}

export interface DietaryOption {
  id: string;
  label: string;
  enLabel: string;
  description?: string;
}

export const DIETARY_TAXONOMY: DietaryCategory[] = [
  {
    id: 'lifestyle',
    title: 'סגנון תזונה ואורח חיים',
    subtitle: 'Dietary Style & Lifestyle',
    colorClass: 'text-emerald-700',
    bgColorClass: 'bg-emerald-500/10',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    options: [
      { id: 'omnivore', label: 'אוכל הכל (ברירת מחדל)', enLabel: 'Omnivore / Everything' },
      { id: 'vegetarian', label: 'צמחוני', enLabel: 'Vegetarian' },
      { id: 'vegan', label: 'טבעוני', enLabel: 'Vegan' }
    ]
  },
  {
    id: 'religion',
    title: 'כשרות ודת',
    subtitle: 'Kosher & Religious',
    colorClass: 'text-sky-700',
    bgColorClass: 'bg-sky-500/10',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    options: [
      { id: 'not_kosher', label: 'לא שומר/ת', enLabel: 'Non-Kosher / Any' },
      { id: 'kosher', label: 'כשר', enLabel: 'Kosher' },
      { id: 'kosher_dairy_meat', label: 'כשר חלבי / כשר בשרי', enLabel: 'Kosher Dairy / Meat' },
      { id: 'halal', label: 'חלאל', enLabel: 'Halal' }
    ]
  },
  {
    id: 'allergies',
    title: 'מגבלות, אלרגיות ורגישויות',
    subtitle: 'Allergies & Sensitivities',
    colorClass: 'text-amber-700',
    bgColorClass: 'bg-amber-500/10',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    options: [
      { id: 'gluten_free', label: 'ללא גלוטן / רגישות לגלוטן', enLabel: 'Gluten-Free' },
      { id: 'lactose_free', label: 'ללא לקטוז / רגישות לחלב', enLabel: 'Lactose-Free' },
      { id: 'sugar_free', label: 'ללא סוכר / סוכרתי', enLabel: 'Sugar-Free' },
      { id: 'nut_free', label: 'אלרגיה לאגוזים / בוטנים', enLabel: 'Nut-Free' },
      { id: 'soy_free', label: 'ללא סויה', enLabel: 'Soy-Free' }
    ]
  }
];

export const ALL_DIETARY_OPTIONS = DIETARY_TAXONOMY.flatMap(cat => cat.options);

export const getDietaryOptionLabel = (idOrLabel: string): string => {
  const match = ALL_DIETARY_OPTIONS.find(opt => opt.id === idOrLabel || opt.label === idOrLabel);
  return match ? match.label : idOrLabel;
};
