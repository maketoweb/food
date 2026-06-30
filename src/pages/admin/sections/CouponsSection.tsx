import React, { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { Ticket, Trash2 } from 'lucide-react';

const CouponsSection: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useApp();
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(10);
  const [newCouponLimit, setNewCouponLimit] = useState<number | ''>('');

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-4">
        <h4 className="text-xs font-bold font-display text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Ticket size={16} className="text-violet-600" /> Crear Nuevo Cupón de Descuento
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Código del Cupón</label>
            <input 
              type="text" 
              value={newCouponCode} 
              onChange={(e) => setNewCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
              placeholder="EJ: FOODAPP10"
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">% Descuento</label>
            <input 
              type="number" 
              value={newCouponDiscount} 
              onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Límite Usos (Opcional)</label>
            <input 
              type="number" 
              value={newCouponLimit} 
              onChange={(e) => setNewCouponLimit(e.target.value === '' ? '' : Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
          </div>
          <button 
            onClick={() => {
              if(!newCouponCode) return alert('Indique el código');
              addCoupon({ 
                code: newCouponCode, 
                discount_percent: newCouponDiscount, 
                active: true, 
                usage_limit: newCouponLimit === '' ? undefined : newCouponLimit 
              });
              setNewCouponCode('');
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Guardar Cupón
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {coupons.map(coupon => (
          <div key={coupon.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-2 relative">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black font-mono text-violet-600">{coupon.code}</span>
              <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded">-{coupon.discount_percent}%</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Usos: {coupon.usage_count} / {coupon.usage_limit || '∞'}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={coupon.active} onChange={(e) => updateCoupon(coupon.id, { active: e.target.checked })} className="accent-violet-600" />
                <span className="text-[10px] font-bold uppercase text-slate-600">Activo</span>
              </label>
              <button onClick={() => deleteCoupon(coupon.id)} className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponsSection;
