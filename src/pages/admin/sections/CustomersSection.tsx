import React from 'react';
import { useApp } from '../../../store/AppContext';

interface CustomersSectionProps {
  setSendMsgTitle: (title: string) => void;
  setSendMsgBody: (body: string) => void;
  setSendMsgModal: (modal: { user: any } | null) => void;
}

const CustomersSection: React.FC<CustomersSectionProps> = ({ setSendMsgTitle, setSendMsgBody, setSendMsgModal }) => {
  const { users, orders, updateUserByAdmin } = useApp();

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gestión de Clientes</h4>
      <div className="flex flex-col gap-3">
        {users && Array.isArray(users) && users.length > 0 ? (
          users.map(user => (
            <div key={user.id} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-3 hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-slate-900">{user.nombre || 'Cliente sin nombre'}</h5>
                  <p className="text-xs text-slate-500 font-mono">Telf: {user.telefono || 'Sin teléfono'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSendMsgTitle('Aviso de Su Pedido');
                      setSendMsgBody('');
                      setSendMsgModal({ user });
                    }}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                  >
                    Enviar Mensaje
                  </button>
                  <button 
                    onClick={() => {
                      const nuevaClave = prompt(`Nueva clave para ${user.nombre || 'cliente'}:`, user.contrasena || '');
                      if (nuevaClave) updateUserByAdmin(user.id, { contrasena: nuevaClave });
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                  >
                    Resetear Clave
                  </button>
                </div>
              </div>
              {/* Orders for this user */}
              <div className="text-[10px] font-mono border-t border-slate-100 pt-3">
                <strong>Historial de Pedidos:</strong>
                {orders && orders.filter(o => o.cliente_telefono === (user.telefono || '')).length > 0 ? (
                  <ul className="list-disc pl-4 mt-2 text-slate-600">
                    {orders.filter(o => o.cliente_telefono === (user.telefono || '')).map(o => (
                      <li key={o.id}>{o.fecha} - {o.status} - ${(Number(o.total_usd) || 0).toFixed(2)}</li>
                    ))}
                  </ul>
                ) : <span className="text-slate-400 pl-2"> Sin pedidos todavía</span>}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-10 text-slate-500 bg-white rounded-xl border border-dashed">No hay clientes registrados.</div>
        )}
      </div>
    </div>
  );
};

export default CustomersSection;
