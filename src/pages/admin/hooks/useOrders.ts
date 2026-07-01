import { useCallback } from 'react';
import { useApp } from '../../../store/AppContext';
import { Order } from '../../../types/store';

export function useOrders() {
  const { orders, updateOrderStatus } = useApp();

  const activeOrders = orders.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado');
  const completedOrders = orders.filter(o => o.status === 'Entregado');
  const cancelledOrders = orders.filter(o => o.status === 'Cancelado');

  const advanceStatus = useCallback((order: Order) => {
    const statusFlow: Order['status'][] = ['Pendiente', 'Procesando', 'En preparación', 'Listo', 'En camino', 'Entregado'];
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx >= 0 && currentIdx < statusFlow.length - 1) {
      updateOrderStatus(order.id, statusFlow[currentIdx + 1]);
    }
  }, [updateOrderStatus]);

  const getOrdersByStatus = useCallback((status: Order['status'] | 'Todos') => {
    if (status === 'Todos') return orders;
    return orders.filter(o => o.status === status);
  }, [orders]);

  const getTotalRevenue = useCallback(() => {
    return orders
      .filter(o => o.status === 'Entregado')
      .reduce((sum, o) => sum + (Number(o.total_usd) || 0), 0);
  }, [orders]);

  const getTodayOrders = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter(o => o.fecha?.startsWith(today));
  }, [orders]);

  return {
    orders,
    activeOrders,
    completedOrders,
    cancelledOrders,
    advanceStatus,
    getOrdersByStatus,
    getTotalRevenue,
    getTodayOrders,
  };
}
