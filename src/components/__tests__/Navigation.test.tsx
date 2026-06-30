import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../Navigation';

vi.mock('../../store/AppContext', () => ({
  useApp: () => ({
    cart: [
      { item: { id: '1', nombre: 'Burger', precio_usd: 7.5, stock: 10 }, quantity: 2 },
      { item: { id: '2', nombre: 'Papas', precio_usd: 3, stock: 20 }, quantity: 1 },
    ],
    config: {
      site_nombre: 'FoodPop',
      theme_color: '#E31837',
      telefono_soporte: '04121234567',
      sedes: [{ activa: true, telefono: '04129998877' }],
    },
    isAdminAuthenticated: false,
    logoutAdmin: vi.fn(),
    currentUser: null,
    notifications: [],
  }),
}));

const defaultProps = {
  currentTab: 'home' as const,
  setTab: vi.fn(),
  onTriggerAdminLogin: vi.fn(),
  drawerOpen: false,
  setDrawerOpen: vi.fn(),
};

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el nombre de la tienda', () => {
    render(<Navigation {...defaultProps} />);
    const elements = screen.getAllByText('FoodPop');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('muestra badge del carrito con cantidad correcta (3 items)', () => {
    render(<Navigation {...defaultProps} />);
    const badges = screen.getAllByText('3');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renderiza tabs de navegación en desktop', () => {
    render(<Navigation {...defaultProps} />);
    expect(screen.getAllByText('Inicio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Menú').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Combos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Contacto').length).toBeGreaterThanOrEqual(1);
  });

  it('tiene navegación bottom bar en mobile', () => {
    render(<Navigation {...defaultProps} />);
    const bottomNav = document.getElementById('bottom-bar');
    expect(bottomNav).toBeInTheDocument();
  });

  it('bottom nav tiene 4 botones', () => {
    render(<Navigation {...defaultProps} />);
    const bottomNav = document.getElementById('bottom-bar');
    expect(bottomNav).toBeInTheDocument();
    const buttons = bottomNav!.querySelectorAll('button');
    expect(buttons.length).toBe(4);
  });
});
