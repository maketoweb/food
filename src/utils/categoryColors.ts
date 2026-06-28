export interface CategoryColor {
  primary: string;
  gradient: string;
  light: string;
  textColor: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  'hamburguesas': {
    primary: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF2D95 100%)',
    light: '#FFF4ED',
    textColor: '#FF6B35',
  },
  'pizzas': {
    primary: '#FF004D',
    gradient: 'linear-gradient(135deg, #FF004D 0%, #FF6B35 100%)',
    light: '#FFF0F0',
    textColor: '#FF004D',
  },
  'pollo': {
    primary: '#FFBE0B',
    gradient: 'linear-gradient(135deg, #FFBE0B 0%, #FF6B35 100%)',
    light: '#FFFDF0',
    textColor: '#D4940A',
  },
  'bebidas': {
    primary: '#00F5D4',
    gradient: 'linear-gradient(135deg, #00F5D4 0%, #3A86FF 100%)',
    light: '#F0FFFC',
    textColor: '#0891B2',
  },
  'postres': {
    primary: '#8338EC',
    gradient: 'linear-gradient(135deg, #8338EC 0%, #FF2D95 100%)',
    light: '#F5F0FF',
    textColor: '#6D28D9',
  },
  'papas & sides': {
    primary: '#FFBE0B',
    gradient: 'linear-gradient(135deg, #FFBE0B 0%, #FF6B35 100%)',
    light: '#FFFBEB',
    textColor: '#D4940A',
  },
  'combos': {
    primary: '#FF2D95',
    gradient: 'linear-gradient(135deg, #FF2D95 0%, #8338EC 100%)',
    light: '#FFF0F8',
    textColor: '#FF2D95',
  },
  'entradas': {
    primary: '#00F5D4',
    gradient: 'linear-gradient(135deg, #00F5D4 0%, #3A86FF 100%)',
    light: '#F0FFFC',
    textColor: '#0D9488',
  },
};

const DEFAULT_COLOR: CategoryColor = {
  primary: '#FF6B35',
  gradient: 'linear-gradient(135deg, #FF6B35 0%, #FF2D95 100%)',
  light: '#FFF4ED',
  textColor: '#FF6B35',
};

export function getCategoryColor(categoryName: string): CategoryColor {
  const key = categoryName.toLowerCase().trim();
  return CATEGORY_COLORS[key] || DEFAULT_COLOR;
}
