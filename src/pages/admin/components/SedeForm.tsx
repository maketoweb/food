import React, { useState } from 'react';
import { Sede } from '../../../types/store';
import { Save, Trash2 } from 'lucide-react';

interface SedeFormProps {
  sede?: Sede | null;
  onSave: (sede: Sede) => void;
  onDelete?: (id: string) => void;
}

export const SedeForm: React.FC<SedeFormProps> = ({ sede, onSave, onDelete }) => {
  const [nombre, setNombre] = useState(sede?.nombre || '');
  const [direccion, setDireccion] = useState(sede?.direccion || '');
  const [telefono, setTelefono] = useState(sede?.telefono || '');
  const [lat, setLat] = useState(sede?.coordenadas?.lat || 10.48);
  const [lng, setLng] = useState(sede?.coordenadas?.lng || -66.9);
  const [horario, setHorario] = useState(sede?.horario || '');
  const [esPrincipal, setEsPrincipal] = useState(sede?.es_principal || false);
  const [activa, setActiva] = useState(sede?.activa !== false);

  const handleSave = () => {
    if (!nombre.trim()) { alert('El nombre es obligatorio'); return; }
    onSave({
      id: sede?.id || `sede-${Date.now()}`,
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      coordenadas: { lat, lng },
      horario: horario.trim(),
      es_principal: esPrincipal,
      activa,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-slate-200 rounded-xl">
      <h4 className="text-xs font-bold text-slate-800">{sede ? 'Editar Sede' : 'Nueva Sede'}</h4>
      <div className="grid grid-cols-2 gap-3">
        <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre *" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
        <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
      </div>
      <input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" step="0.0001" value={lat} onChange={e => setLat(Number(e.target.value))} placeholder="Latitud" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
        <input type="number" step="0.0001" value={lng} onChange={e => setLng(Number(e.target.value))} placeholder="Longitud" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
      </div>
      <input value={horario} onChange={e => setHorario(e.target.value)} placeholder="Horario (ej: Lun-Sab 10am-10pm)" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500" />
      <div className="flex gap-4 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={esPrincipal} onChange={e => setEsPrincipal(e.target.checked)} className="accent-violet-600" /> Principal</label>
        <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={activa} onChange={e => setActiva(e.target.checked)} className="accent-violet-600" /> Activa</label>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="flex items-center gap-1 text-[11px] font-semibold text-white bg-violet-600 rounded-lg px-3 py-2 hover:bg-violet-700 cursor-pointer">
          <Save size={12} /> Guardar
        </button>
        {sede && onDelete && (
          <button onClick={() => onDelete(sede.id)} className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2 hover:bg-red-100 cursor-pointer">
            <Trash2 size={12} /> Eliminar
          </button>
        )}
      </div>
    </div>
  );
};
