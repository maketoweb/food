import React from 'react';
import { Order } from '../../../types/store';
import { Clock, ChevronDown, ChevronUp, Printer, MessageSquare, CheckCircle, Truck, XCircle } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAdvanceStatus: (order: Order) => void;
  onPrint: (order: Order) => void;
  onWhatsApp: (order: Order) => void;
  themeColor: string;
}

const statusConfig: Record<string, { color: string; bg: string; nextLabel: string }> = {
  'Pendiente': { color: 'text-amber-600', bg: 'bg-amber-100', nextLabel: 'Procesar' },
  'Procesando': { color: 'text-blue-600', bg: 'bg-blue-100', nextLabel: 'Preparar' },
  'En preparación': { color: 'text-violet-600', bg: 'bg-violet-100', nextLabel: 'Marcar Listo' },
  'Listo': { color: 'text-green-600', bg: 'bg-green-100', nextLabel: 'Despachar' },
  'En camino': { color: 'text-cyan-600', bg: 'bg-cyan-100', nextLabel: 'Entregar' },
  'Entregado': { color: 'text-emerald-600', bg: 'bg-emerald-100', nextLabel: 'Completado' },
  'Cancelado': { color: 'text-red-600', bg: 'bg-red-100', nextLabel: 'Cancelado' },
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, isExpanded, onToggleExpand, onAdvanceStatus, onPrint, onWhatsApp, themeColor }) => {
  const config = statusConfig[order.status] || statusConfig['Pendiente'];
  const isFinal = order.status === 'Entregado' || order.status === 'Cancelado';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">#{order.id}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                {order.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{order.cliente_nombre} · {order.cliente_telefono}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black" style={{ color: themeColor }}>${order.total_usd?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
              <Clock size={10} />
              {order.fecha ? new Date(order.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{order.items?.length || 0} items · {order.metodo_pago}</span>
          {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50">
          <div className="space-y-1 mb-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-700">{item.nombre} x{item.cantidad}</span>
                <span className="font-mono text-slate-500">${(item.precio_usd * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 mb-3">
            📍 {order.direccion_envio || 'Sin dirección'} · {order.tipo_entrega}
          </div>
          <div className="flex gap-2">
            {!isFinal && (
              <button onClick={() => onAdvanceStatus(order)} className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-bold text-white rounded-lg cursor-pointer" style={{ backgroundColor: themeColor }}>
                {order.status === 'En camino' ? <Truck size={12} /> : <CheckCircle size={12} />}
                {config.nextLabel}
              </button>
            )}
            <button onClick={() => onPrint(order)} className="p-2 text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer">
              <Printer size={14} />
            </button>
            <button onClick={() => onWhatsApp(order)} className="p-2 text-green-600 bg-white border border-slate-200 rounded-lg hover:bg-green-50 cursor-pointer">
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
