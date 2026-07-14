import React, { useState } from 'react';
import { useApp } from '../../../store/AppContext';
import { LoyaltyTier, LoyaltyTransaction, RewardItem } from '../../../types/store';
import { Award, Settings, List, UserPlus, Plus, Trash2, X, Check, Search, Star, TrendingUp, ArrowUp, ArrowDown, Gift, Smartphone, Package } from 'lucide-react';

const LoyaltySection: React.FC = () => {
  const { config, updateConfig, users, adjustUserPoints, getLoyaltyTransactions, getUserLoyaltyTier, getUserLoyaltyPoints, rewardCatalog, addRewardItem, updateRewardItem, deleteRewardItem } = useApp();
  const loyalty = config.loyalty;
  const themeColor = config.theme_color || '#007AFF';

  const [activeTab, setActiveTab] = useState<'config' | 'tiers' | 'history' | 'adjust' | 'rewards' | 'pwa'>('config');
  const [searchPhone, setSearchPhone] = useState('');
  const [adjustPoints, setAdjustPoints] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [newTier, setNewTier] = useState<Partial<LoyaltyTier>>({});

  const [newReward, setNewReward] = useState<Partial<RewardItem>>({});

  const tabs = [
    { id: 'config' as const, label: 'Config', icon: Settings },
    { id: 'tiers' as const, label: 'Niveles', icon: Award },
    { id: 'rewards' as const, label: 'Canje', icon: Gift },
    { id: 'history' as const, label: 'Historial', icon: List },
    { id: 'adjust' as const, label: 'Ajustar', icon: UserPlus },
    { id: 'pwa' as const, label: 'App', icon: Smartphone },
  ];

  const handleToggleLoyalty = () => {
    if (!loyalty) return;
    updateConfig({ loyalty: { ...loyalty, enabled: !loyalty.enabled } });
  };

  const handleUpdateField = (field: string, value: number) => {
    if (!loyalty) return;
    updateConfig({ loyalty: { ...loyalty, [field]: value } });
  };

  const handleUpdateBonus = (field: string, value: number) => {
    if (!loyalty) return;
    updateConfig({
      loyalty: {
        ...loyalty,
        bonus_actions: { ...(loyalty.bonus_actions || {}), [field]: value }
      }
    });
  };

  const handleAddTier = () => {
    if (!loyalty || !newTier.name) return;
    const tier: LoyaltyTier = {
      id: `tier-${Date.now()}`,
      name: newTier.name || '',
      min_points: newTier.min_points || 0,
      multiplier: newTier.multiplier || 1,
      benefits: newTier.benefits || [],
      color: newTier.color || themeColor,
    };
    updateConfig({
      loyalty: {
        ...loyalty,
        tiers: [...loyalty.tiers, tier]
      }
    });
    setNewTier({});
  };

  const handleDeleteTier = (tierId: string) => {
    if (!loyalty) return;
    updateConfig({
      loyalty: {
        ...loyalty,
        tiers: loyalty.tiers.filter(t => t.id !== tierId)
      }
    });
  };

  const handleSaveEditTier = () => {
    if (!loyalty || !editingTier) return;
    updateConfig({
      loyalty: {
        ...loyalty,
        tiers: loyalty.tiers.map(t => t.id === editingTier.id ? editingTier : t)
      }
    });
    setEditingTier(null);
  };

  const handleAdjustPoints = async () => {
    if (!selectedUserId || adjustPoints === 0 || !adjustReason.trim()) return;
    await adjustUserPoints(selectedUserId, adjustPoints, adjustReason.trim());
    setAdjustPoints(0);
    setAdjustReason('');
    setSelectedUserId(null);
    setSearchPhone('');
  };

  const filteredUsers = users.filter(u =>
    searchPhone.trim() && (u.telefono?.includes(searchPhone) || u.nombre?.toLowerCase().includes(searchPhone.toLowerCase()))
  ).slice(0, 5);

  const allTransactions = loyalty?.enabled
    ? users.flatMap(u => getLoyaltyTransactions(u.id)).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer touch-target"
              style={{
                background: isActive ? themeColor : 'var(--ios-card)',
                color: isActive ? '#FFFFFF' : 'var(--ios-text-secondary)',
                border: `1px solid ${isActive ? themeColor : 'var(--ios-border)'}`,
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>Sistema de Fidelización</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--ios-text-secondary)' }}>Activa para que clients acumulen puntos</p>
              </div>
              <button onClick={handleToggleLoyalty} className="admin-toggle" style={{ background: loyalty?.enabled ? themeColor : 'var(--ios-border)' }}>
                <div style={{
                  position: 'absolute', top: 2, left: 2, width: 27, height: 27, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transform: loyalty?.enabled ? 'translateX(20px)' : 'none', transition: 'transform 0.2s'
                }} />
              </button>
            </div>
          </div>

          {loyalty?.enabled && (
            <>
              <div className="admin-card p-4">
                <p className="admin-label mb-3">Ganar Puntos</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--ios-text)' }}>Puntos por $1 gastado</span>
                    <input type="number" value={loyalty.points_per_dollar} onChange={e => handleUpdateField('points_per_dollar', Number(e.target.value))}
                      className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--ios-text)' }}>Pedido mínimo para ganar ($)</span>
                    <input type="number" value={loyalty.min_order_for_points} onChange={e => handleUpdateField('min_order_for_points', Number(e.target.value))}
                      className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--ios-text)' }}>Puntos de bienvenida</span>
                    <input type="number" value={loyalty.welcome_bonus} onChange={e => handleUpdateField('welcome_bonus', Number(e.target.value))}
                      className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                  </div>
                </div>
              </div>

              <div className="admin-card p-4">
                <p className="admin-label mb-3">Canjear Puntos</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--ios-text)' }}>Puntos = $1 de descuento</span>
                    <input type="number" value={loyalty.redemption_rate} onChange={e => handleUpdateField('redemption_rate', Number(e.target.value))}
                      className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--ios-text)' }}>Descuento máximo por canje (%)</span>
                    <input type="number" value={loyalty.max_discount_percent} onChange={e => handleUpdateField('max_discount_percent', Number(e.target.value))}
                      className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                  </div>
                </div>
              </div>

              <div className="admin-card p-4">
                <p className="admin-label mb-3">Bonos Extra</p>
                <div className="space-y-3">
                  {[
                    { key: 'daily_login', label: 'Login diario' },
                    { key: 'first_order', label: 'Primera compra' },
                    { key: 'review', label: 'Dejar reseña' },
                    { key: 'referral', label: 'Referir amigo' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--ios-text)' }}>{item.label}</span>
                      <input type="number" value={(loyalty.bonus_actions as any)?.[item.key] ?? 0} onChange={e => handleUpdateBonus(item.key, Number(e.target.value))}
                        className="admin-input w-20 text-center" style={{ padding: '8px', fontSize: '14px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tiers Tab */}
      {activeTab === 'tiers' && (
        <div className="flex flex-col gap-3">
          {loyalty?.tiers.map(tier => (
            <div key={tier.id} className="admin-card p-4">
              {editingTier?.id === tier.id ? (
                <div className="flex flex-col gap-3">
                  <input type="text" value={editingTier.name} onChange={e => setEditingTier({ ...editingTier, name: e.target.value })}
                    className="admin-input" placeholder="Nombre del nivel" />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="admin-label">Puntos mínimos</label>
                      <input type="number" value={editingTier.min_points} onChange={e => setEditingTier({ ...editingTier, min_points: Number(e.target.value) })}
                        className="admin-input mt-1" />
                    </div>
                    <div className="flex-1">
                      <label className="admin-label">Multiplicador</label>
                      <input type="number" step="0.25" value={editingTier.multiplier} onChange={e => setEditingTier({ ...editingTier, multiplier: Number(e.target.value) })}
                        className="admin-input mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEditTier} className="admin-btn flex-1 flex items-center justify-center gap-2">
                      <Check size={16} /> Guardar
                    </button>
                    <button onClick={() => setEditingTier(null)} className="admin-btn-secondary admin-btn flex-1 flex items-center justify-center gap-2">
                      <X size={16} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: tier.color }}>
                    {tier.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>{tier.name}</p>
                    <p className="text-sm" style={{ color: 'var(--ios-text-secondary)' }}>
                      {tier.min_points}+ pts · x{tier.multiplier}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingTier(tier)} className="p-2 rounded-xl" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                      <Settings size={16} />
                    </button>
                    <button onClick={() => handleDeleteTier(tier.id)} className="p-2 rounded-xl" style={{ background: '#FF3B3015', color: '#FF3B30' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new tier */}
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Agregar Nuevo Nivel</p>
            <div className="flex flex-col gap-3">
              <input type="text" value={newTier.name || ''} onChange={e => setNewTier({ ...newTier, name: e.target.value })}
                className="admin-input" placeholder="Nombre (ej: Diamante)" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="admin-label">Puntos mínimos</label>
                  <input type="number" value={newTier.min_points || ''} onChange={e => setNewTier({ ...newTier, min_points: Number(e.target.value) })}
                    className="admin-input mt-1" placeholder="0" />
                </div>
                <div className="flex-1">
                  <label className="admin-label">Multiplicador</label>
                  <input type="number" step="0.25" value={newTier.multiplier || ''} onChange={e => setNewTier({ ...newTier, multiplier: Number(e.target.value) })}
                    className="admin-input mt-1" placeholder="1" />
                </div>
              </div>
              <button onClick={handleAddTier} disabled={!newTier.name}
                className="admin-btn flex items-center justify-center gap-2 disabled:opacity-40">
                <Plus size={16} /> Agregar Nivel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {!loyalty?.enabled ? (
            <div className="admin-card p-6 text-center">
              <Award size={40} style={{ color: 'var(--ios-text-tertiary)', margin: '0 auto' }} />
              <p className="text-base font-bold mt-3" style={{ color: 'var(--ios-text)' }}>Fidelización desactivada</p>
              <p className="text-sm mt-1" style={{ color: 'var(--ios-text-secondary)' }}>Activa el sistema para ver el historial</p>
            </div>
          ) : allTransactions.length === 0 ? (
            <div className="admin-card p-6 text-center">
              <List size={40} style={{ color: 'var(--ios-text-tertiary)', margin: '0 auto' }} />
              <p className="text-base font-bold mt-3" style={{ color: 'var(--ios-text)' }}>Sin transacciones</p>
              <p className="text-sm mt-1" style={{ color: 'var(--ios-text-secondary)' }}>Aún no hay movimiento de puntos</p>
            </div>
          ) : (
            allTransactions.slice(0, 50).map(tx => {
              const user = users.find(u => u.id === tx.user_id);
              return (
                <div key={tx.id} className="admin-card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: tx.points > 0 ? '#34C75915' : '#FF3B3015', color: tx.points > 0 ? '#34C759' : '#FF3B30' }}>
                    {tx.points > 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>{user?.nombre || 'Usuario'}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--ios-text-secondary)' }}>{tx.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: tx.points > 0 ? '#34C759' : '#FF3B30' }}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ios-text-tertiary)' }}>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Adjust Tab */}
      {activeTab === 'adjust' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Buscar Cliente</p>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3" style={{ color: 'var(--ios-text-tertiary)' }} />
              <input type="text" value={searchPhone} onChange={e => { setSearchPhone(e.target.value); setSelectedUserId(null); }}
                className="admin-input pl-10" placeholder="Teléfono o nombre..." />
            </div>
            {filteredUsers.length > 0 && !selectedUserId && (
              <div className="mt-2 space-y-1">
                {filteredUsers.map(user => (
                  <button key={user.id} onClick={() => { setSelectedUserId(user.id); setSearchPhone(user.nombre || user.telefono); }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer"
                    style={{ background: 'var(--ios-bg)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: themeColor }}>
                      {user.nombre?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>{user.nombre}</p>
                      <p className="text-xs" style={{ color: 'var(--ios-text-secondary)' }}>{user.telefono}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="admin-card p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: themeColor }}>
                  {selectedUser.nombre?.[0] || '?'}
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>{selectedUser.nombre}</p>
                  <p className="text-sm" style={{ color: 'var(--ios-text-secondary)' }}>{selectedUser.telefono}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--ios-bg)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Puntos</p>
                  <p className="text-xl font-bold" style={{ color: themeColor }}>{getUserLoyaltyPoints(selectedUser.id)}</p>
                </div>
                <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'var(--ios-bg)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Nivel</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--ios-text)' }}>{getUserLoyaltyTier(selectedUser.id)?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setAdjustPoints(Math.abs(adjustPoints) || 10)}
                  className="admin-btn flex-1 flex items-center justify-center gap-2"
                  style={{ background: '#34C759' }}>
                  <ArrowUp size={16} /> Sumar
                </button>
                <button onClick={() => setAdjustPoints(-Math.abs(adjustPoints) || -10)}
                  className="admin-btn flex-1 flex items-center justify-center gap-2"
                  style={{ background: '#FF3B30' }}>
                  <ArrowDown size={16} /> Restar
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="admin-label">Cantidad de puntos</label>
                  <input type="number" value={adjustPoints || ''} onChange={e => setAdjustPoints(Number(e.target.value))}
                    className="admin-input mt-1" placeholder="Ej: 50" />
                </div>
                <div>
                  <label className="admin-label">Razón del ajuste</label>
                  <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                    className="admin-input mt-1" placeholder="Ej: Bonificación manual" />
                </div>
                <button onClick={handleAdjustPoints}
                  disabled={adjustPoints === 0 || !adjustReason.trim()}
                  className="admin-btn flex items-center justify-center gap-2 disabled:opacity-40">
                  <Check size={16} /> Aplicar Ajuste
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CATÁLOGO DE RECOMPENSAS ═══ */}
      {activeTab === 'rewards' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Agregar Recompensa al Catálogo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="admin-label">Nombre</label>
                <input type="text" value={newReward.name || ''} onChange={e => setNewReward(p => ({ ...p, name: e.target.value }))}
                  className="admin-input mt-1" placeholder="Ej: Envío Gratis" />
              </div>
              <div>
                <label className="admin-label">Puntos Requeridos</label>
                <input type="number" value={newReward.points_cost || ''} onChange={e => setNewReward(p => ({ ...p, points_cost: Number(e.target.value) }))}
                  className="admin-input mt-1" placeholder="Ej: 500" />
              </div>
              <div>
                <label className="admin-label">Tipo</label>
                <select value={newReward.reward_type || 'discount'} onChange={e => setNewReward(p => ({ ...p, reward_type: e.target.value as RewardItem['reward_type'] }))}
                  className="admin-input mt-1">
                  <option value="discount">Descuento ($)</option>
                  <option value="free_product">Producto Gratis</option>
                  <option value="free_shipping">Envío Gratis</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Valor (USD)</label>
                <input type="number" step="0.01" value={newReward.reward_value || ''} onChange={e => setNewReward(p => ({ ...p, reward_value: Number(e.target.value) }))}
                  className="admin-input mt-1" placeholder="Ej: 2.50" />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Descripción</label>
                <input type="text" value={newReward.description || ''} onChange={e => setNewReward(p => ({ ...p, description: e.target.value }))}
                  className="admin-input mt-1" placeholder="Ej: Descuento de $2.50 en tu próxima compra" />
              </div>
            </div>
            <button onClick={async () => {
              if (!newReward.name || !newReward.points_cost) return;
              await addRewardItem({ name: newReward.name, description: newReward.description || '', points_cost: newReward.points_cost || 0, reward_type: newReward.reward_type || 'discount', reward_value: newReward.reward_value || 0, active: true });
              setNewReward({});
            }} disabled={!newReward.name || !newReward.points_cost}
              className="admin-btn mt-3 flex items-center justify-center gap-2 disabled:opacity-40">
              <Plus size={16} /> Agregar Recompensa
            </button>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Catálogo Actual ({rewardCatalog.length} items)</p>
            {rewardCatalog.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--ios-text-secondary)' }}>No hay recompensas en el catálogo.</p>
            ) : (
              <div className="space-y-2">
                {rewardCatalog.map(reward => (
                  <div key={reward.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--ios-bg)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: themeColor }}>
                      {reward.reward_type === 'discount' ? <TrendingUp size={16} /> : reward.reward_type === 'free_shipping' ? <Package size={16} /> : <Gift size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>{reward.name}</p>
                      <p className="text-xs" style={{ color: 'var(--ios-text-secondary)' }}>{reward.points_cost} pts · ${reward.reward_value} · {reward.reward_type}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateRewardItem(reward.id, { active: !reward.active })}
                        className="p-2 rounded-lg" style={{ background: reward.active ? '#34C75920' : '#FF3B3020' }}>
                        {reward.active ? <Check size={14} style={{ color: '#34C759' }} /> : <X size={14} style={{ color: '#FF3B30' }} />}
                      </button>
                      <button onClick={() => deleteRewardItem(reward.id)} className="p-2 rounded-lg" style={{ background: '#FF3B3020' }}>
                        <Trash2 size={14} style={{ color: '#FF3B30' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PWA INSTALL TRACKING ═══ */}
      {activeTab === 'pwa' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <div className="flex items-center gap-3 mb-4">
              <Smartphone size={20} style={{ color: themeColor }} />
              <div>
                <p className="admin-label">Descargas de App</p>
                <p className="text-xs" style={{ color: 'var(--ios-text-secondary)' }}>Clientes que instalaron la app en su celular</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--ios-bg)' }}>
                <p className="text-2xl font-bold" style={{ color: themeColor }}>{users.filter(u => u.is_pwa_installed).length}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Con App</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--ios-bg)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--ios-text)' }}>{users.filter(u => !u.is_pwa_installed).length}</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Sin App</p>
              </div>
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--ios-bg)' }}>
                <p className="text-2xl font-bold" style={{ color: '#34C759' }}>{users.length > 0 ? Math.round(users.filter(u => u.is_pwa_installed).length / users.length * 100) : 0}%</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Tasa Inst.</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Todos los Clientes</p>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {users.sort((a, b) => (b.is_pwa_installed ? 1 : 0) - (a.is_pwa_installed ? 1 : 0)).map(user => (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--ios-bg)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: user.is_pwa_installed ? '#34C759' : '#8E8E93' }}>
                    {user.nombre?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ios-text)' }}>{user.nombre}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--ios-text-secondary)' }}>{user.telefono}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold" style={{ color: 'var(--ios-text-secondary)' }}>{getUserLoyaltyPoints(user.id)} pts</span>
                    {user.is_pwa_installed ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: '#34C75920', color: '#34C759' }}>APP</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: '#8E8E9320', color: '#8E8E93' }}>WEB</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltySection;
