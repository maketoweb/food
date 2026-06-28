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
  'papas & sides': {
    primary: '#FFB703',
    gradient: 'linear-gradient(135deg, #FFB703 0%, #FFD166 100%)',
    light: '#FFFBEB',
    textColor: '#D4940A',
  },
  'combos': {
    primary: '#E63946',
    gradient: 'linear-gradient(135deg, #E63946 0%, #FF6B6B 100%)',
    light: '#FFF0F0',
    textColor: '#E63946',
  },
  'bebidas': {
    primary: '#22D3EE',
    gradient: 'linear-gradient(135deg, #22D3EE 0%, #67E8F9 100%)',
    light: '#ECFEFF',
    textColor: '#0891B2',
  },
  'postres': {
    primary: '#C084FC',
    gradient: 'linear-gradient(135deg, #C084FC 0%, #E879F9 100%)',
    light: '#FAF5FF',
    textColor: '#9333EA',
  },
  'nuggets & tenders': {
    primary: '#F472B6',
    gradient: 'linear-gradient(135deg, #F472B6 0%, #FB7185 100%)',
    light: '#FDF2F8',
    textColor: '#DB2777',
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
