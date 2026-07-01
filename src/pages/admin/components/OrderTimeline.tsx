import React from 'react';
import { CheckCircle, Clock, Circle } from 'lucide-react';

interface OrderTimelineProps {
  statuses: string[];
  currentStatus: string;
  themeColor: string;
}

const statusOrder = ['Pendiente', 'Procesando', 'En preparación', 'Listo', 'En camino', 'Entregado'];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus, themeColor }) => {
  const currentIdx = statusOrder.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {statusOrder.map((status, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isCancelled = currentStatus === 'Cancelado';

        return (
          <React.Fragment key={status}>
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCancelled ? 'bg-red-100' :
                isCompleted ? 'bg-green-100' :
                isCurrent ? 'bg-white border-2' : 'bg-slate-100'
              }`} style={isCurrent ? { borderColor: themeColor } : {}}>
                {isCancelled ? <Circle size={12} className="text-red-400" /> :
                 isCompleted ? <CheckCircle size={12} className="text-green-500" /> :
                 isCurrent ? <Clock size={12} style={{ color: themeColor }} /> :
                 <Circle size={12} className="text-slate-300" />}
              </div>
              <span className={`text-[8px] font-medium text-center leading-tight ${isCurrent ? 'font-bold' : 'text-slate-400'}`}
                style={isCurrent ? { color: themeColor } : {}}>
                {status}
              </span>
            </div>
            {i < statusOrder.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[16px] mt-[-12px] rounded ${i < currentIdx ? 'bg-green-300' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
