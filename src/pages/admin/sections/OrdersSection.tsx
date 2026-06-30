import React, { useState, useMemo } from 'react';
import { useApp } from '../../../store/AppContext';
import { Order, OrderItem } from '../../../types/store';
import { Eye, EyeOff, Edit, Printer, Receipt, Download } from 'lucide-react';

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
  const { orders } = useApp();
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
            <div 
              key={order.id} 
              className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col gap-3 shadow-sm hover:border-indigo-200 transition-colors"
            >
              {/* Title order row */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-slate-200 pb-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{order.id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      order.status === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'Procesando' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'En preparación' ? 'bg-indigo-100 text-indigo-700' :
                      order.status === 'Listo' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'En camino' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'Entregado' ? 'bg-green-100 text-green-700' :
                      order.status === 'Cancelado' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status === 'Pendiente' ? '🟡 Pendiente' :
                       order.status === 'Procesando' ? '🔵 Procesando' :
                       order.status === 'En preparación' ? '🟣 Preparando' :
                       order.status === 'Listo' ? '🟢 Listo' :
                       order.status === 'En camino' ? '🟣 En camino' :
                       order.status === 'Entregado' ? '✅ Entregado' :
                       order.status === 'Cancelado' ? '❌ Cancelado' :
                       order.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">📅 {order.fecha}</div>
                </div>

                <div className="sm:text-right flex flex-row sm:flex-col gap-2 sm:gap-0 items-center sm:items-end">
                  <div className="text-xs font-bold text-violet-600 font-mono">${(Number(order.total_usd) || 0).toFixed(2)}</div>
                  <div className="text-[10px] text-violet-600 font-mono font-bold">{(Number(order.total_bs) || 0).toFixed(2)} Bs</div>
                </div>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 text-xs text-slate-700 gap-1.5 font-mono">
                <div className="truncate">👤 Cliente: <strong className="text-slate-900 font-sans">{order.cliente_nombre}</strong></div>
                <div className="truncate">📞 Telf: <strong className="text-slate-900">{order.cliente_telefono}</strong></div>
                <div className="col-span-2">📧 Email: <strong className="text-slate-900">{order.cliente_email || 'No registrado'}</strong></div>
                {order.cupon_codigo && (
                  <div className="col-span-2 text-violet-600">🎫 Cupón: <strong className="font-bold">{order.cupon_codigo} (-${(Number(order.descuento_cupon_usd) || 0).toFixed(2)})</strong></div>
                )}
                <div className="col-span-2">📍 Destino: <strong className="text-slate-900">{order.direccion_envio}</strong></div>
                <div className="col-span-2 flex gap-4">
                  <span>🚚 Tipo: <strong className="text-slate-900">{order.tipo_entrega === 'mesa' ? 'Mesa' : 'Delivery'}</strong></span>
                  {order.numero_mesa && <span>🪑 Mesa: <strong className="text-slate-900">#{order.numero_mesa}</strong></span>}
                </div>
              </div>

              {/* Items itemized summary list */}
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col gap-1 text-[11px] font-mono">
                {order.items.map(it => (
                  <div key={it.food_id} className="flex justify-between text-slate-600">
                    <span className="truncate pr-2">{it.cantidad}x {it.nombre}</span>
                    <span>${(Number(it.precio_usd) * Number(it.cantidad || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Action transitions status with notifications dispatcher */}
              <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center pt-2 gap-3">
                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                  <button
                    type="button"
                    onClick={() => toggleOrderDetail(order.id)}
                    className="flex-1 sm:flex-none bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Eye size={12} /> {openOrderDetailIds.includes(order.id) ? 'Cerrar' : 'Ver Detalles'}
                  </button>
                  
                  {openOrderDetailIds.includes(order.id) && (
                    <button
                      type="button"
                      onClick={() => setEditingOrderItems(order)}
                      className="flex-1 sm:flex-none bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                    >
                      <Edit size={12} /> Editar Items
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPrintingOrder(order)}
                    className="flex-1 sm:flex-none bg-[#18181b] text-gray-300 border border-[#27272a] hover:text-white px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer hover:bg-[#27272a] transition-colors"
                  >
                    <Receipt size={12} /> Digital
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintingOrder(order);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="flex-1 sm:flex-none bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-700 px-2.5 py-2 rounded-lg text-[11px] font-mono flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Printer size={12} /> Imprimir Ticket
                  </button>
                </div>

                <div className="flex gap-1 text-[10px] font-mono w-full xl:w-auto mt-2 xl:mt-0">
                  {order.status !== 'Entregado' && order.status !== 'Cancelado' && (
                    <button
                      type="button"
                      onClick={() => handleStatusAdvance(order)}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-1 active:scale-95 transition-all text-[11px] cursor-pointer w-full sm:w-auto"
                    >
                      {order.status === 'Pendiente' ? 'Aceptar Pedido ➔' : order.status === 'Procesando' ? 'Comenzar Preparación ➔' : order.status === 'En preparación' ? 'Marcar como Listo ➔' : order.status === 'Listo' ? 'Despachar (Pedido Saliendo) 🛵' : 'Siguiente Paso ➔'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersSection;
