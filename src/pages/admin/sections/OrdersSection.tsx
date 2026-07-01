import React, { useState, useMemo } from 'react';
import { useApp } from '../../../store/AppContext';
import { Order, OrderItem } from '../../../types/store';
import { Download } from 'lucide-react';
import { OrderCard } from '../components/OrderCard';
import { OrderTimeline } from '../components/OrderTimeline';

interface OrdersSectionProps {
  openOrderDetailIds: string[];
  toggleOrderDetail: (orderId: string) => void;
  editingOrderItems: Order | null;
  setEditingOrderItems: (order: Order | null) => void;
  setPrintingOrder: (order: Order) => void;
  handleStatusAdvance: (order: Order) => void;
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  openOrderDetailIds,
  toggleOrderDetail,
  editingOrderItems,
  setEditingOrderItems,
  setPrintingOrder,
  handleStatusAdvance,
}) => {
  const { orders, config } = useApp();
  const [orderFilter, setOrderFilter] = useState<Order['status'] | 'Todos'>('Todos');

  const activeOrdersMapped = useMemo(() => {
    if (orderFilter === 'Todos') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert("No hay pedidos para exportar.");
      return;
    }

    const headers = ["ID", "Fecha", "Cliente", "Email", "Telefono", "Cupon", "Desc Cupon", "Metodo Pago", "Total USD", "Total Bs", "Status", "Direccion"];
    const rows = orders.map(order => [
      order.id,
      `"${order.fecha}"`,
      `"${order.cliente_nombre.replace(/"/g, '""')}"`,
      order.cliente_email || "N/A",
      order.cliente_telefono,
      order.cupon_codigo || "N/A",
      (Number(order.descuento_cupon_usd) || 0).toFixed(2),
      order.metodo_pago,
      order.total_usd.toFixed(2),
      order.total_bs.toFixed(2),
      order.status,
      `"${order.direccion_envio.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
        <h4 className="text-xs uppercase font-mono font-bold text-[#a1a1aa] tracking-wider">Cola de Pedidos Recibidos</h4>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <button
            onClick={exportOrdersToCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
          >
            <Download size={14} /> Exportar CSV
          </button>
          
          {/* Status filters */}
          <div className="flex gap-1 text-[10px] font-mono bg-slate-100 p-1 border border-slate-200 rounded-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
            {['Todos', 'Pendiente', 'Procesando', 'En preparación', 'Listo', 'En camino', 'Entregado'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setOrderFilter(f as any)}
                className={`px-3 py-1.5 rounded-md cursor-pointer whitespace-nowrap ${orderFilter === f ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activeOrdersMapped.length === 0 ? (
          <div className="p-10 border border-dashed border-[#27272a] rounded-lg text-center text-xs text-gray-500">
            No hay pedidos en cola con estado: {orderFilter}.
          </div>
        ) : (
          activeOrdersMapped.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={openOrderDetailIds.includes(order.id)}
              onToggleExpand={() => toggleOrderDetail(order.id)}
              onAdvanceStatus={handleStatusAdvance}
              onPrint={setPrintingOrder}
              onWhatsApp={(o) => {
                const phone = o.cliente_telefono?.replace(/\D/g, '');
                if (phone) window.open(`https://wa.me/58${phone}?text=Tu pedido #${o.id} está ${o.status}`, '_blank');
              }}
              themeColor={config.theme_color || '#0f5d34'}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersSection;
