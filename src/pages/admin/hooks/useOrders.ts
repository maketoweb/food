import { useCallback, useMemo } from 'react';
import { useApp } from '../../../store/AppContext';
import { Order } from '../../../types/store';

export function useOrders(sedeId?: string) {
  const { orders, updateOrderStatus } = useApp();

  const filteredBySede = useMemo(() => {
    if (!sedeId) return orders;
    return orders.filter(o => o.sede_id === sedeId || !o.sede_id);
  }, [orders, sedeId]);

  const activeOrders = useMemo(() => filteredBySede.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado'), [filteredBySede]);
  const completedOrders = useMemo(() => filteredBySede.filter(o => o.status === 'Entregado'), [filteredBySede]);
  const cancelledOrders = useMemo(() => filteredBySede.filter(o => o.status === 'Cancelado'), [filteredBySede]);

  const advanceStatus = useCallback((order: Order) => {
    const statusFlow: Order['status'][] = ['Pendiente', 'Procesando', 'En preparación', 'Listo', 'En camino', 'Entregado'];
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx >= 0 && currentIdx < statusFlow.length - 1) {
      updateOrderStatus(order.id, statusFlow[currentIdx + 1]);
    }
  }, [updateOrderStatus]);

  const getOrdersByStatus = useCallback((status: Order['status'] | 'Todos') => {
    if (status === 'Todos') return filteredBySede;
    return filteredBySede.filter(o => o.status === status);
  }, [filteredBySede]);

  const getTotalRevenue = useCallback(() => {
    return filteredBySede
      .filter(o => o.status === 'Entregado')
      .reduce((sum, o) => sum + (Number(o.total_usd) || 0), 0);
  }, [filteredBySede]);

  const getTodayOrders = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return filteredBySede.filter(o => o.fecha?.startsWith(today));
  }, [filteredBySede]);

  return {
    orders: filteredBySede,
    activeOrders,
    completedOrders,
    cancelledOrders,
    advanceStatus,
    getOrdersByStatus,
    getTotalRevenue,
    getTodayOrders,
  };
}
