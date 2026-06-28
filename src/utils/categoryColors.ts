export interface CategoryColor {
  primary: string;
  gradient: string;
  light: string;
  textColor: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'hamburguesas': {
    primary: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    light: '#FFF4ED',
    textColor: '#FF6B35',
  },
  'burgers': {
    primary: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
    light: '#FFF4ED',
    textColor: '#FF6B35',
  },
  'pizzas': {
    primary: '#E63946',
    gradient: 'linear-gradient(135deg, #E63946 0%, #FF6B6B 100%)',
    light: '#FFF0F0',
    textColor: '#E63946',
  },
  'pastas': {
    primary: '#FFB703',
    gradient: 'linear-gradient(135deg, #FFB703 0%, #FFD166 100%)',
    light: '#FFFBEB',
    textColor: '#D4940A',
  },
  'postres': {
    primary: '#C084FC',
    gradient: 'linear-gradient(135deg, #C084FC 0%, #E879F9 100%)',
    light: '#FAF5FF',
    textColor: '#9333EA',
  },
  'bebidas': {
    primary: '#22D3EE',
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #67E8F9 100%)',
    light: '#ECFEFF',
    textColor: '#0891B2',
  },
  'entradas': {
    primary: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    light: '#ECFDF5',
    textColor: '#059669',
  },
  'ensaladas': {
    primary: '#84CC16',
    gradient: 'linear-gradient(135deg, #84CC16 0%, #A3E635 100%)',
    light: '#F7FEE7',
    textColor: '#65A30D',
  },
  'combos': {
    primary: '#F472B6',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FB7185 100%)',
    light: '#FDF2F8',
    textColor: '#DB2777',
  },
  'sopas': {
    primary: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
    light: '#FFF7ED',
    textColor: '#EA580C',
  },
  'tacos': {
    primary: '#EAB308',
    gradient: 'linear-gradient(135deg, #EAB308 0%, #FACC15 100%)',
    light: '#FEFCE8',
    textColor: '#CA8A04',
  },
  'sushi': {
    primary: '#0EA5E9',
    gradient: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
    light: '#F0F9FF',
    textColor: '#0284C7',
  },
  'pollo': {
    primary: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    light: '#FFFBEB',
    textColor: '#D97706',
  },
  'carne': {
    primary: '#DC2626',
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
    light: '#FEF2F2',
    textColor: '#B91C1C',
  },
  'pescado': {
    primary: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
    light: '#ECFEFF',
    textColor: '#0891B2',
  },
};

const DEFAULT_COLOR: CategoryColor = {
  primary: '#FF6B35',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF8F5E 100%)',
  light: '#FFF4ED',
  textColor: '#FF6B35',
};

export function getCategoryColor(categoryName: string): CategoryColor {
  const key = categoryName.toLowerCase().trim();
  return CATEGORY_COLORS[key] || DEFAULT_COLOR;
}

export function getCategoryGradient(categoryName: string): string {
  return getCategoryColor(categoryName).gradient;
}

export function getCategoryPrimary(categoryName: string): string {
  return getCategoryColor(categoryName).primary;
}

export function getCategoryLight(categoryName: string): string {
  return getCategoryColor(categoryName).light;
}
