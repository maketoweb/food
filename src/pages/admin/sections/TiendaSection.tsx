import React, { useState, useRef } from 'react';
import { useApp } from '../../../store/AppContext';
import { uploadFileToStorage, compressImage } from '../../../store/supabaseClient';
import { DeliveryZone, Sede } from '../../../types/store';
import ImageField from '../components/ImageField';
import {
  Store, Image, Smartphone, Type, FileText, MapPin, CreditCard,
  Grid, Search, Share2, Building2, AlertTriangle,
  Plus, Trash2, X, Check, ChevronUp, ChevronDown, Eye, EyeOff,
  MessageSquare, ExternalLink
} from 'lucide-react';

const TiendaSection: React.FC = () => {
  const { config, updateConfig, currentUser, syncPushSubscription } = useApp();
  const themeColor = config.theme_color || '#007AFF';

  const [activeTab, setActiveTab] = useState<
    'general' | 'logos' | 'pwa' | 'banners' | 'typography' | 'texts' |
    'delivery' | 'payments' | 'categories' | 'seo' | 'social' | 'sedes'
  >('general');

  // Banner state
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState<number | null>(null);

  // Delivery zone state
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCost, setNewZoneCost] = useState(0);
  const [newZoneMinKm, setNewZoneMinKm] = useState(0);
  const [newZoneMaxKm, setNewZoneMaxKm] = useState(0);

  // Sedes state
  const [sedeForm, setSedeForm] = useState({ nombre: '', telefono: '', whatsapp_numero: '', direccion: '', horario: '', lat: 0, lng: 0 });
  const [editingSedeId, setEditingSedeId] = useState<string | null>(null);

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Store },
    { id: 'logos' as const, label: 'Logos', icon: Image },
    { id: 'pwa' as const, label: 'PWA', icon: Smartphone },
    { id: 'banners' as const, label: 'Banners', icon: Image },
    { id: 'typography' as const, label: 'Tipografia', icon: Type },
    { id: 'texts' as const, label: 'Textos', icon: FileText },
    { id: 'delivery' as const, label: 'Delivery', icon: MapPin },
    { id: 'payments' as const, label: 'Pagos', icon: CreditCard },
    { id: 'categories' as const, label: 'Categorias', icon: Grid },
    { id: 'seo' as const, label: 'SEO', icon: Search },
    { id: 'social' as const, label: 'Redes', icon: Share2 },
    { id: 'sedes' as const, label: 'Sucursales', icon: Building2 },
  ];

  // Banner handlers
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(index);
    try {
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      const url = await uploadFileToStorage(compressed, 'settings', `banners/${Date.now()}.webp`);
      const newBanners = [...(config.banners || ['', '', ''])];
      newBanners[index] = url;
      updateConfig({ banners: newBanners });
    } catch (err: any) {
      alert('Error al subir imagen: ' + err.message);
    }
    setUploadingBanner(null);
    if (e.target) e.target.value = '';
  };

  const handleAddBanner = () => {
    const newBanners = [...(config.banners || []), ''];
    const newTexts = [...(config.banner_texts || []), ''];
    updateConfig({ banners: newBanners, banner_texts: newTexts });
  };

  const handleRemoveBanner = (index: number) => {
    const newBanners = (config.banners || []).filter((_, i) => i !== index);
    const newTexts = (config.banner_texts || []).filter((_, i) => i !== index);
    updateConfig({ banners: newBanners, banner_texts: newTexts });
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const banners = [...(config.banners || [])];
    const texts = [...(config.banner_texts || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;
    [banners[index], banners[newIndex]] = [banners[newIndex], banners[index]];
    [texts[index], texts[newIndex]] = [texts[newIndex], texts[index]];
    updateConfig({ banners, banner_texts: texts });
  };

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="admin-label mb-3">{children}</p>
  );

  const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>{children}</label>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0"
                style={{
                  background: isActive ? themeColor : 'var(--ios-card)',
                  color: isActive ? '#FFFFFF' : 'var(--ios-text-secondary)',
                  border: `1px solid ${isActive ? themeColor : 'var(--ios-border)'}`,
                }}>
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== 1. GENERAL ========== */}
      {activeTab === 'general' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Nombre del Sitio</SectionTitle>
            <input type="text" value={config.site_nombre} onChange={e => updateConfig({ site_nombre: e.target.value })}
              className="admin-input" placeholder="Mi Restaurante" />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Mensaje de Bienvenida</SectionTitle>
            <textarea value={config.mensaje_bienvenida || ''} onChange={e => updateConfig({ mensaje_bienvenida: e.target.value })}
              className="admin-input" rows={3} placeholder="La mejor hamburgueseria con delivery express." style={{ resize: 'none' }} />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Direccion Fisica</SectionTitle>
            <input type="text" value={config.direccion_fisica} onChange={e => updateConfig({ direccion_fisica: e.target.value })}
              className="admin-input" placeholder="Av. Principal, Local #12, Ciudad" />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Telefono / WhatsApp</SectionTitle>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold" style={{ color: 'var(--ios-text-secondary)' }}>Numero Maestro de Notificaciones</span>
                {currentUser && config.telefono_soporte !== currentUser.telefono && (
                  <button onClick={async () => {
                    updateConfig({ telefono_soporte: currentUser.telefono });
                    const result = await syncPushSubscription();
                    if (!result.success) alert('Error al sincronizar push: ' + result.error);
                  }} className="text-[9px] px-2 py-0.5 rounded font-bold uppercase cursor-pointer" style={{ background: '#FF950020', color: '#FF9500', border: '1px solid #FF950040' }}>
                    Usar mi numero
                  </button>
                )}
              </div>
              <input type="tel" value={config.telefono_soporte} onChange={e => updateConfig({ telefono_soporte: e.target.value })}
                className="admin-input" placeholder="+584124058904" style={{
                  borderColor: currentUser && config.telefono_soporte !== currentUser.telefono ? '#FF9500' : undefined
                }} />
              {currentUser && config.telefono_soporte !== currentUser.telefono && (
                <p className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#FF9500' }}>
                  <AlertTriangle size={10} /> Para recibir notificaciones Push, este numero debe coincidir con tu perfil ({currentUser.telefono}).
                </p>
              )}
            </div>
            {config.telefono_soporte && (
              <a href={`https://wa.me/${config.telefono_soporte.replace(/\D/g, '').replace(/^0/, '58')}`}
                target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: themeColor }}>
                <MessageSquare size={12} /> Abrir WhatsApp <ExternalLink size={10} />
              </a>
            )}
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Coordenadas de la Tienda</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Latitud</FieldLabel>
                <input type="number" step="any" value={config.coordenadas_tienda?.lat || 0}
                  onChange={e => updateConfig({ coordenadas_tienda: { ...config.coordenadas_tienda, lat: parseFloat(e.target.value) || 0 } })}
                  className="admin-input mt-1" placeholder="10.198300" />
              </div>
              <div>
                <FieldLabel>Longitud</FieldLabel>
                <input type="number" step="any" value={config.coordenadas_tienda?.lng || 0}
                  onChange={e => updateConfig({ coordenadas_tienda: { ...config.coordenadas_tienda, lng: parseFloat(e.target.value) || 0 } })}
                  className="admin-input mt-1" placeholder="-68.004400" />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Estado de la Tienda</SectionTitle>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config.esta_abierta !== false}
                  onChange={e => updateConfig({ esta_abierta: e.target.checked })}
                  className="accent-activator rounded h-4 w-4" style={{ accentColor: themeColor }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Tienda Abierta</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config.tiene_mesas || false}
                  onChange={e => updateConfig({ tiene_mesas: e.target.checked })}
                  className="accent-activator rounded h-4 w-4" style={{ accentColor: themeColor }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Tiene Mesas</span>
              </label>
              {config.tiene_mesas && (
                <div>
                  <FieldLabel>Total de Mesas</FieldLabel>
                  <input type="number" min="0" value={config.total_mesas || 0}
                    onChange={e => updateConfig({ total_mesas: parseInt(e.target.value) || 0 })}
                    className="admin-input mt-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== 2. LOGOS ========== */}
      {activeTab === 'logos' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Logo Principal (PWA + Tienda)</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Se usa como icono de la app movil (PWA) y en el header de la tienda.
            </p>
            <ImageField
              value={config.logo_url || ''}
              onChange={url => updateConfig({ logo_url: url })}
              bucket="settings"
              folder="logos"
              maxSize={400}
              previewSize="lg"
            />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Logo Secundario</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Logo alternativo para usar en el footer o secciones especiales.
            </p>
            <ImageField
              value={config.secondary_logo_url || ''}
              onChange={url => updateConfig({ secondary_logo_url: url })}
              bucket="settings"
              folder="logos"
              maxSize={400}
              previewSize="md"
            />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Favicon (Icono del Navegador)</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Icono que aparece en la pestana del navegador. Recomendado: 32x32 o 64x64 PNG.
            </p>
            <ImageField
              value={config.favicon_url || ''}
              onChange={url => updateConfig({ favicon_url: url })}
              bucket="settings"
              folder="favicons"
              maxSize={64}
              previewSize="sm"
              accept="image/png, image/jpeg, image/x-icon"
            />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Vista Previa</SectionTitle>
            <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--ios-bg)' }}>
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover" style={{ border: '2px solid var(--ios-border)' }} />
              ) : (
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: themeColor }}>
                  {config.site_nombre?.[0] || 'A'}
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--ios-text)' }}>{config.site_nombre || 'Mi Tienda'}</p>
                <p className="text-xs" style={{ color: 'var(--ios-text-secondary)' }}>Logo principal + PWA icon</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== 3. PWA ========== */}
      {activeTab === 'pwa' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Icono PWA (Pantalla de Inicio)</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Icono cuadrado 512x512 que se muestra en la pantalla de inicio del celular.
            </p>
            <ImageField
              value={config.pwa_icon_url || ''}
              onChange={url => updateConfig({ pwa_icon_url: url })}
              bucket="settings"
              folder="pwa-icons"
              maxSize={512}
              previewSize="lg"
            />
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Nombre de la App (PWA)</SectionTitle>
            <input type="text" value={config.site_nombre} onChange={e => updateConfig({ site_nombre: e.target.value })}
              className="admin-input" placeholder="Mi Restaurante" />
            <p className="text-[10px] mt-1" style={{ color: 'var(--ios-text-tertiary)' }}>
              Aparece en la pantalla de inicio y en la barra de notificaciones.
            </p>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Color del Tema (PWA)</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Color de la barra de navegacion y splash screen de la app movil.
            </p>
            <div className="flex items-center gap-3">
              <input type="color" value={config.theme_color || '#FF6B35'}
                onChange={e => updateConfig({ theme_color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer" style={{ border: 'none', padding: 0 }} />
              <input type="text" value={config.theme_color || '#FF6B35'}
                onChange={e => updateConfig({ theme_color: e.target.value })}
                className="admin-input flex-1 font-mono" />
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Vista Previa de la App</SectionTitle>
            <div className="rounded-2xl overflow-hidden mx-auto" style={{ width: 220, border: '3px solid var(--ios-border)', background: '#000' }}>
              {/* Status bar */}
              <div className="h-6 flex items-center justify-center" style={{ background: config.theme_color || '#FF6B35' }}>
                <span className="text-[8px] text-white/80 font-semibold">{config.site_nombre || 'App'}</span>
              </div>
              {/* App icon preview */}
              <div className="flex flex-col items-center justify-center py-6" style={{ background: `linear-gradient(135deg, ${config.theme_color || '#FF6B35'}22, ${config.secondary_color || '#1e293b'}22)` }}>
                {config.pwa_icon_url ? (
                  <img src={config.pwa_icon_url} alt="PWA Icon" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                ) : config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: config.theme_color || '#FF6B35' }}>
                    {config.site_nombre?.[0] || 'A'}
                  </div>
                )}
                <p className="text-xs font-bold mt-3" style={{ color: 'var(--ios-text)' }}>{config.site_nombre || 'Mi App'}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--ios-text-secondary)' }}>Instalar app</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Mensaje de Instalacion</SectionTitle>
            <textarea value={config.mensaje_bienvenida || ''} onChange={e => updateConfig({ mensaje_bienvenida: e.target.value })}
              className="admin-input" rows={3} placeholder="Mensaje que ven los clientes al instalar la app..." style={{ resize: 'none' }} />
          </div>
        </div>
      )}

      {/* ========== 4. BANNERS ========== */}
      {activeTab === 'banners' && (
        <div className="flex flex-col gap-4">
          {(config.banners || []).map((banner, index) => (
            <div key={index} className="admin-card p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Banner {index + 1}</SectionTitle>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0}
                    className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => handleMoveBanner(index, 'down')} disabled={index === (config.banners?.length || 0) - 1}
                    className="p-1.5 rounded-lg disabled:opacity-30 cursor-pointer" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                    <ChevronDown size={14} />
                  </button>
                  <button onClick={() => handleRemoveBanner(index)}
                    className="p-1.5 rounded-lg cursor-pointer" style={{ background: '#FF3B3015', color: '#FF3B30' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {banner ? (
                <div className="relative rounded-xl overflow-hidden mb-2" style={{ aspectRatio: '2/1' }}>
                  <img src={banner} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                  {uploadingBanner === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl p-6 text-center mb-2" style={{ background: 'var(--ios-bg)', border: '2px dashed var(--ios-border)' }}>
                  <Image size={32} style={{ color: 'var(--ios-text-tertiary)', margin: '0 auto' }} />
                  <p className="text-sm mt-2" style={{ color: 'var(--ios-text-secondary)' }}>Sin imagen</p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => bannerInputRef.current?.click()}
                  className="admin-btn flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer" style={{ padding: '10px' }}>
                  <Plus size={14} /> Subir
                </button>
                <input type="file" ref={bannerInputRef} hidden accept="image/*" onChange={e => handleBannerUpload(e, index)} />
              </div>

              <input type="text" value={config.banner_texts?.[index] || ''}
                onChange={e => {
                  const newTexts = [...(config.banner_texts || [])];
                  newTexts[index] = e.target.value;
                  updateConfig({ banner_texts: newTexts });
                }}
                className="admin-input mt-2" placeholder="Texto del banner..." />
            </div>
          ))}

          <button onClick={handleAddBanner}
            className="admin-card p-4 flex items-center justify-center gap-2 cursor-pointer transition-all"
            style={{ border: '2px dashed var(--ios-border)', color: 'var(--ios-text-secondary)' }}>
            <Plus size={18} /> Agregar Banner
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--ios-text-tertiary)' }}>
            Formatos: JPG, PNG, WebP · Tamanio recomendado: 1200x600px
          </p>
        </div>
      )}

      {/* ========== 6. TIPOGRAFIA ========== */}
      {activeTab === 'typography' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Fuente del Sitio</SectionTitle>
            <select value={config.font_display || 'Fredoka'} onChange={e => updateConfig({ font_display: e.target.value })}
              className="admin-input">
              <option value="Fredoka">Fredoka</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Inter">Inter</option>
              <option value="Nunito">Nunito</option>
            </select>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Seccion Hero (Home)</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Titulo Principal (H1)</FieldLabel>
                <input type="text" value={config.hero_title || ''} onChange={e => updateConfig({ hero_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Pide Tu Comida Favorita" />
              </div>
              <div>
                <FieldLabel>Subtitulo</FieldLabel>
                <input type="text" value={config.hero_subtitle || ''} onChange={e => updateConfig({ hero_subtitle: e.target.value })}
                  className="admin-input mt-1" placeholder="Delivery express en minutos" />
              </div>
              <div>
                <FieldLabel>Texto del Boton CTA</FieldLabel>
                <input type="text" value={config.hero_cta_text || ''} onChange={e => updateConfig({ hero_cta_text: e.target.value })}
                  className="admin-input mt-1" placeholder="Ver Menu" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Efecto del Hero</FieldLabel>
                  <select value={config.hero_effect || 'fade'} onChange={e => updateConfig({ hero_effect: e.target.value as any })}
                    className="admin-input mt-1">
                    <option value="fade">Fade</option>
                    <option value="slide">Slide</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="none">Ninguno</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Altura del Hero</FieldLabel>
                  <select value={config.hero_height || 'auto'} onChange={e => updateConfig({ hero_height: e.target.value as any })}
                    className="admin-input mt-1">
                    <option value="auto">Automatica</option>
                    <option value="60vh">60% vh</option>
                    <option value="70vh">70% vh</option>
                    <option value="full">100% vh</option>
                  </select>
                </div>
              </div>
              <div>
                <FieldLabel>Opacidad del Overlay (%): {config.hero_overlay_opacity ?? 100}</FieldLabel>
                <input type="range" min="0" max="100" value={config.hero_overlay_opacity ?? 100}
                  onChange={e => updateConfig({ hero_overlay_opacity: parseInt(e.target.value) })}
                  className="w-full mt-1" />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Vista Previa del Hero</SectionTitle>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ios-border)' }}>
              <div className="relative p-6 text-center" style={{
                background: `linear-gradient(135deg, ${config.theme_color || '#FF6B35'}, ${config.secondary_color || '#1e293b'})`,
                opacity: (config.hero_overlay_opacity ?? 100) / 100,
              }}>
                <p className="text-white font-bold text-lg">{config.hero_title || 'Pide Tu Comida Favorita'}</p>
                <p className="text-white/80 text-sm mt-1">{config.hero_subtitle || 'Delivery express en minutos'}</p>
                {config.hero_cta_text && (
                  <button className="mt-3 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: config.accent_color || '#FF6B35', color: 'white' }}>
                    {config.hero_cta_text}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== 7. TEXTOS ========== */}
      {activeTab === 'texts' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Titulos de Secciones</SectionTitle>
            <div className="flex flex-col gap-3">
              {[
                { key: 'section_highlights_title', label: 'Destacados', placeholder: 'Destacados' },
                { key: 'section_categories_title', label: 'Categorias', placeholder: 'LO MAS POPULAR' },
                { key: 'section_bestseller_title', label: 'Mas Vendidos', placeholder: 'LO MAS PEDIDO' },
                { key: 'section_rewards_title', label: 'Recompensas', placeholder: 'RECOMPENSAS' },
                { key: 'section_rewards_description', label: 'Descripcion Recompensas', placeholder: 'Acumula puntos...' },
              ].map(item => (
                <div key={item.key}>
                  <FieldLabel>{item.label}</FieldLabel>
                  <input type="text" value={(config as any)[item.key] || ''} onChange={e => updateConfig({ [item.key]: e.target.value })}
                    className="admin-input mt-1" placeholder={item.placeholder} />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Pasos de Recompensas</SectionTitle>
            <div className="flex flex-col gap-3">
              {[
                { key1: 'rewards_step1_title', key2: 'rewards_step1_desc', label: 'Paso 1', defaultTitle: 'Registrate gratis', defaultDesc: 'Crea tu cuenta en segundos' },
                { key1: 'rewards_step2_title', key2: 'rewards_step2_desc', label: 'Paso 2', defaultTitle: 'Ordena y acumula', defaultDesc: 'Gana puntos con cada pedido' },
                { key1: 'rewards_step3_title', key2: 'rewards_step3_desc', label: 'Paso 3', defaultTitle: 'Canjea recompensas', defaultDesc: 'Intercambia puntos por comida gratis' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <label className="text-xs font-bold" style={{ color: 'var(--ios-text)' }}>{step.label}</label>
                  <input type="text" value={(config as any)[step.key1] || step.defaultTitle} onChange={e => updateConfig({ [step.key1]: e.target.value })}
                    className="admin-input" placeholder={step.defaultTitle} />
                  <input type="text" value={(config as any)[step.key2] || step.defaultDesc} onChange={e => updateConfig({ [step.key2]: e.target.value })}
                    className="admin-input" placeholder={step.defaultDesc} />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Footer - Sobre Nosotros</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Titulo "Sobre Nosotros"</FieldLabel>
                <input type="text" value={config.footer_about_title || ''} onChange={e => updateConfig({ footer_about_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Sobre Mi Restaurante" />
              </div>
              <div>
                <FieldLabel>Descripcion "Sobre Nosotros"</FieldLabel>
                <textarea value={config.footer_about_text || ''} onChange={e => updateConfig({ footer_about_text: e.target.value })}
                  className="admin-input mt-1" rows={4} placeholder="Somos un restaurante de comida rapida en Valencia..." style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Footer - General</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Texto del Footer</FieldLabel>
                <textarea value={config.footer_text || ''} onChange={e => updateConfig({ footer_text: e.target.value })}
                  className="admin-input mt-1" rows={2} placeholder="Tu restaurante favorito..." style={{ resize: 'none' }} />
              </div>
              <div>
                <FieldLabel>Copyright</FieldLabel>
                <input type="text" value={config.footer_copyright || ''} onChange={e => updateConfig({ footer_copyright: e.target.value })}
                  className="admin-input mt-1" placeholder="2025 Mi Restaurante" />
              </div>
              <div>
                <FieldLabel>URL del Sitio (SEO)</FieldLabel>
                <input type="url" value={config.site_url || ''} onChange={e => updateConfig({ site_url: e.target.value })}
                  className="admin-input mt-1" placeholder="https://mirestaurante.com" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== 8. DELIVERY ========== */}
      {activeTab === 'delivery' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Opciones de Delivery</SectionTitle>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config.delivery_gratis || false}
                  onChange={e => updateConfig({ delivery_gratis: e.target.checked })}
                  className="rounded h-4 w-4" style={{ accentColor: themeColor }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Delivery Gratis</span>
              </label>
              {!config.delivery_gratis && (
                <div>
                  <FieldLabel>Costo base por Km ($)</FieldLabel>
                  <input type="number" min="0" step="0.1" value={config.costo_delivery_km || 0}
                    onChange={e => updateConfig({ costo_delivery_km: parseFloat(e.target.value) || 0 })}
                    className="admin-input mt-1" />
                </div>
              )}
              {config.delivery_gratis && (
                <div>
                  <FieldLabel>Minimo para delivery gratis ($)</FieldLabel>
                  <input type="number" min="0" step="0.5" value={config.delivery_gratis_threshold || 0}
                    onChange={e => updateConfig({ delivery_gratis_threshold: parseFloat(e.target.value) || 0 })}
                    className="admin-input mt-1" />
                </div>
              )}
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Recogida en el Local</SectionTitle>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={config.recogida_en_local !== false}
                onChange={e => updateConfig({ recogida_en_local: e.target.checked })}
                className="rounded h-4 w-4" style={{ accentColor: themeColor }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Ofrecer Recogida en Tienda</span>
            </label>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Entrega por Zonas</SectionTitle>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input type="checkbox" checked={config.entrega_por_zonas || false}
                onChange={e => updateConfig({ entrega_por_zonas: e.target.checked })}
                className="rounded h-4 w-4" style={{ accentColor: themeColor }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Ofrecer Entrega por Zonas</span>
            </label>

            {config.entrega_por_zonas && (
              <div className="flex flex-col gap-2">
                {(config.delivery_zonas || []).map((z, idx) => (
                  <div key={z.id} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'var(--ios-bg)', border: '1px solid var(--ios-border)' }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate" style={{ color: 'var(--ios-text)' }}>{z.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--ios-text-secondary)' }}>{z.minKm} - {z.maxKm} km | ${z.cost.toFixed(2)}</span>
                    </div>
                    <button onClick={() => { setEditingZone(z); setNewZoneName(z.name); setNewZoneCost(z.cost); setNewZoneMinKm(z.minKm); setNewZoneMaxKm(z.maxKm); }}
                      className="p-1.5 rounded-md cursor-pointer" style={{ color: themeColor }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => { const updated = (config.delivery_zonas || []).filter((_, i) => i !== idx); updateConfig({ delivery_zonas: updated }); }}
                      className="p-1.5 rounded-md cursor-pointer" style={{ color: '#FF3B30' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <div className="p-3 rounded-lg" style={{ background: 'var(--ios-bg)', border: '1px solid var(--ios-border)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--ios-text)' }}>{editingZone ? 'Editar Zona' : 'Nueva Zona'}</p>
                  <div className="flex flex-col gap-2">
                    <input type="text" value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
                      placeholder="Nombre de la zona" className="admin-input text-xs" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <FieldLabel>Costo ($)</FieldLabel>
                        <input type="number" min="0" step="0.5" value={newZoneCost}
                          onChange={e => setNewZoneCost(parseFloat(e.target.value) || 0)}
                          className="admin-input mt-1 text-xs" />
                      </div>
                      <div>
                        <FieldLabel>Km Min</FieldLabel>
                        <input type="number" min="0" value={newZoneMinKm}
                          onChange={e => setNewZoneMinKm(parseFloat(e.target.value) || 0)}
                          className="admin-input mt-1 text-xs" />
                      </div>
                      <div>
                        <FieldLabel>Km Max</FieldLabel>
                        <input type="number" min="0" value={newZoneMaxKm}
                          onChange={e => setNewZoneMaxKm(parseFloat(e.target.value) || 0)}
                          className="admin-input mt-1 text-xs" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        if (!newZoneName.trim()) return;
                        const zone: DeliveryZone = { id: editingZone ? editingZone.id : `z${Date.now()}`, name: newZoneName.trim(), cost: newZoneCost, minKm: newZoneMinKm, maxKm: newZoneMaxKm };
                        const zones = [...(config.delivery_zonas || [])];
                        if (editingZone) { const idx = zones.findIndex(z => z.id === editingZone.id); if (idx >= 0) zones[idx] = zone; }
                        else { zones.push(zone); }
                        updateConfig({ delivery_zonas: zones });
                        setEditingZone(null); setNewZoneName(''); setNewZoneCost(0); setNewZoneMinKm(0); setNewZoneMaxKm(0);
                      }} disabled={!newZoneName.trim()}
                        className="admin-btn text-xs flex-1 cursor-pointer disabled:opacity-40">
                        {editingZone ? 'Guardar' : 'Agregar Zona'}
                      </button>
                      {editingZone && (
                        <button onClick={() => { setEditingZone(null); setNewZoneName(''); setNewZoneCost(0); setNewZoneMinKm(0); setNewZoneMaxKm(0); }}
                          className="admin-btn-secondary admin-btn text-xs cursor-pointer">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Envio Nacional</SectionTitle>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={config.envio_nacional || false}
                  onChange={e => updateConfig({ envio_nacional: e.target.checked })}
                  className="rounded h-4 w-4" style={{ accentColor: themeColor }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>Habilitar Envio Nacional</span>
              </label>
              {config.envio_nacional && (
                <div>
                  <FieldLabel>Costo Envio Nacional ($)</FieldLabel>
                  <input type="number" min="0" step="0.5" value={config.costo_envio_nacional || 0}
                    onChange={e => updateConfig({ costo_envio_nacional: parseFloat(e.target.value) || 0 })}
                    className="admin-input mt-1" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== 9. PAGOS ========== */}
      {activeTab === 'payments' && (
        <div className="flex flex-col gap-4">
          {[
            { key: 'pagomovil_enabled', label: 'Pago Movil Bs', dataKey: 'pagomovil_data', discKey: 'pagomovil_discount_percent', placeholder: 'Banco, telefono, cedula...' },
            { key: 'zelle_enabled', label: 'Zelle USD', dataKey: 'zelle_data', discKey: 'zelle_discount_percent', placeholder: 'Email de Zelle...' },
            { key: 'efectivo_enabled', label: 'Efectivo', dataKey: 'efectivo_data', discKey: 'efectivo_discount_percent', placeholder: 'Descripcion del metodo...' },
            { key: 'transferencia_enabled', label: 'Transferencia Bancaria', dataKey: 'transferencia_data', discKey: 'transferencia_discount_percent', placeholder: 'Datos de cuenta...' },
          ].map(p => (
            <div key={p.key} className="admin-card p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>{p.label}</SectionTitle>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(config as any)[p.key]}
                    onChange={e => updateConfig({ [p.key]: e.target.checked })}
                    className="rounded h-4 w-4" style={{ accentColor: themeColor }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--ios-text)' }}>
                    {(config as any)[p.key] ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>
              {(config as any)[p.key] && (
                <div className="flex flex-col gap-3">
                  <div>
                    <FieldLabel>Datos del Metodo de Pago</FieldLabel>
                    <input type="text" value={(config as any)[p.dataKey]}
                      onChange={e => updateConfig({ [p.dataKey]: e.target.value })}
                      className="admin-input mt-1" placeholder={p.placeholder} />
                  </div>
                  <div>
                    <FieldLabel>Descuento por usar este metodo (%)</FieldLabel>
                    <input type="number" min="0" max="100" step="0.1" value={(config as any)[p.discKey]}
                      onChange={e => updateConfig({ [p.discKey]: parseFloat(e.target.value) || 0 })}
                      className="admin-input mt-1" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="admin-card p-4">
            <SectionTitle>Tasa de Cambio (Bs/USD)</SectionTitle>
            <input type="number" min="0" step="0.01" value={config.tasa_cambio || 0}
              onChange={e => updateConfig({ tasa_cambio: parseFloat(e.target.value) || 0 })}
              className="admin-input" placeholder="612.43" />
          </div>
        </div>
      )}

      {/* ========== 10. CATEGORIAS ========== */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Gestionar Categorias</SectionTitle>
            <div className="flex gap-2 mb-3">
              <input type="text" id="tienda-new-category" placeholder="Nueva categoria..."
                className="admin-input flex-1"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !(config.categories || []).includes(val)) {
                      updateConfig({ categories: [...(config.categories || []), val] });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }} />
              <button onClick={() => {
                const el = document.getElementById('tienda-new-category') as HTMLInputElement;
                const val = el?.value.trim();
                if (val && !(config.categories || []).includes(val)) {
                  updateConfig({ categories: [...(config.categories || []), val] });
                  el.value = '';
                }
              }} className="admin-btn px-4 cursor-pointer">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(config.categories || []).map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--ios-bg)' }}>
                  <span className="text-xs font-semibold truncate pr-1" style={{ color: 'var(--ios-text)' }}>{cat}</span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => {
                      const nuevo = prompt(`Editar categoria "${cat}":`, cat);
                      if (nuevo && nuevo.trim() !== cat) {
                        const cats = (config.categories || []).map(c => c === cat ? nuevo.trim() : c);
                        const imgs = { ...(config.categories_images || {}) };
                        if (imgs[cat]) { imgs[nuevo.trim()] = imgs[cat]; delete imgs[cat]; }
                        updateConfig({ categories: cats, categories_images: imgs });
                      }
                    }} className="p-1 rounded cursor-pointer" style={{ color: 'var(--ios-text-secondary)' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => {
                      if (confirm(`Eliminar categoria "${cat}"? Los productos se moveran a "Hamburguesas".`)) {
                        const cats = (config.categories || []).filter(c => c !== cat);
                        updateConfig({ categories: cats });
                      }
                    }} className="p-1 rounded cursor-pointer" style={{ color: '#FF3B30' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Imagenes de Categorias</SectionTitle>
            <p className="text-xs mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Sube una imagen de fondo para cada categoria (aparece como tarjeta en Home).
            </p>
            <div className="flex flex-col gap-3">
              {(config.categories || []).map((cat) => (
                <div key={cat} className="p-3 rounded-lg" style={{ background: 'var(--ios-bg)', border: '1px solid var(--ios-border)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--ios-text)' }}>{cat}</p>
                  <ImageField
                    value={(config.categories_images || {})[cat] || ''}
                    onChange={url => updateConfig({ categories_images: { ...(config.categories_images || {}), [cat]: url } })}
                    bucket="categories"
                    folder={cat.replace(/\s+/g, '-').toLowerCase()}
                    maxSize={400}
                    previewSize="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== 11. SEO ========== */}
      {activeTab === 'seo' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>SEO - Pagina Principal</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Titulo (title)</FieldLabel>
                <input type="text" value={config.seo_home_title || ''} onChange={e => updateConfig({ seo_home_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Mi Restaurante - Delivery de Comida" />
              </div>
              <div>
                <FieldLabel>Descripcion (meta description)</FieldLabel>
                <textarea value={config.seo_home_description || ''} onChange={e => updateConfig({ seo_home_description: e.target.value })}
                  className="admin-input mt-1" rows={3} placeholder="Pide tu comida favorita con delivery express..." style={{ resize: 'none' }} />
              </div>
              <div>
                <FieldLabel>Palabras clave (keywords)</FieldLabel>
                <input type="text" value={config.seo_home_keywords || ''} onChange={e => updateConfig({ seo_home_keywords: e.target.value })}
                  className="admin-input mt-1" placeholder="restaurante, delivery, comida, hamburguesas" />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>SEO - Catalogo</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Titulo</FieldLabel>
                <input type="text" value={config.seo_catalog_title || ''} onChange={e => updateConfig({ seo_catalog_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Menu y Precios | Mi Restaurante" />
              </div>
              <div>
                <FieldLabel>Descripcion</FieldLabel>
                <textarea value={config.seo_catalog_description || ''} onChange={e => updateConfig({ seo_catalog_description: e.target.value })}
                  className="admin-input mt-1" rows={2} placeholder="Explora nuestro menu completo..." style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>Schema JSON-LD</SectionTitle>
            <div className="flex flex-col gap-3">
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <select value={config.jsonld_type || 'Restaurant'} onChange={e => updateConfig({ jsonld_type: e.target.value })}
                  className="admin-input mt-1">
                  <option value="Restaurant">Restaurant</option>
                  <option value="FoodEstablishment">Food Establishment</option>
                  <option value="FastFoodRestaurant">Fast Food Restaurant</option>
                </select>
              </div>
              <div>
                <FieldLabel>Rango de Precios</FieldLabel>
                <input type="text" value={config.jsonld_priceRange || '$$'} onChange={e => updateConfig({ jsonld_priceRange: e.target.value })}
                  className="admin-input mt-1" placeholder="$$" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== 12. REDES ========== */}
      {activeTab === 'social' && (
        <div className="flex flex-col gap-4">
          {[
            { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/tuusuario' },
            { key: 'twitter_url', label: 'Twitter / X', placeholder: 'https://x.com/tuusuario' },
            { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/tupagina' },
            { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@tuusuario' },
            { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@tucanal' },
          ].map(item => (
            <div key={item.key} className="admin-card p-4">
              <SectionTitle>{item.label}</SectionTitle>
              <input type="url" value={(config as any)[item.key] || ''}
                onChange={e => updateConfig({ [item.key]: e.target.value })}
                className="admin-input mt-2" placeholder={item.placeholder} />
            </div>
          ))}
        </div>
      )}

      {/* ========== 13. SEDES ========== */}
      {activeTab === 'sedes' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <SectionTitle>Gestion de Sucursales</SectionTitle>
            <p className="text-[10px] mb-3" style={{ color: 'var(--ios-text-tertiary)' }}>
              Administra las ubicaciones fisicas de tu negocio. La sede principal se usa para calcular distancias y zonas de delivery.
            </p>

            <div className="flex flex-col gap-2">
              {(config.sedes || []).map((sede) => (
                <div key={sede.id} className="p-3 rounded-xl" style={{
                  background: sede.es_principal ? 'var(--ios-bg)' : 'var(--ios-card)',
                  border: `1px solid ${sede.es_principal ? themeColor + '40' : 'var(--ios-border)'}`
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>{sede.nombre}</span>
                        {sede.es_principal && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: themeColor + '20', color: themeColor }}>Principal</span>
                        )}
                        {!sede.activa && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-tertiary)' }}>Inactiva</span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--ios-text-secondary)' }}>{sede.direccion}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px]" style={{ color: 'var(--ios-text-tertiary)' }}>
                        <span>Tel: {sede.telefono}</span>
                        {sede.whatsapp_numero && <span>WhatsApp: {sede.whatsapp_numero}</span>}
                        {sede.horario && <span>{sede.horario}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => {
                        const updated = (config.sedes || []).map(s => s.id === sede.id ? { ...s, activa: !s.activa } : s);
                        updateConfig({ sedes: updated });
                      }} className="p-1.5 rounded-lg cursor-pointer" style={{ color: sede.activa ? '#FF9500' : '#34C759' }}>
                        {sede.activa ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      {!sede.es_principal && (
                        <button onClick={() => {
                          if (confirm(`Marcar "${sede.nombre}" como sede principal?`)) {
                            const updated = (config.sedes || []).map(s => ({ ...s, es_principal: s.id === sede.id }));
                            updateConfig({ sedes: updated });
                          }
                        }} className="p-1.5 rounded-lg cursor-pointer" style={{ color: themeColor }}>
                          <Check size={14} />
                        </button>
                      )}
                      <button onClick={() => {
                        setEditingSedeId(sede.id);
                        setSedeForm({
                          nombre: sede.nombre,
                          telefono: sede.telefono || '',
                          whatsapp_numero: sede.whatsapp_numero || '',
                          direccion: sede.direccion || '',
                          horario: sede.horario || '',
                          lat: sede.coordenadas?.lat || 0,
                          lng: sede.coordenadas?.lng || 0,
                        });
                      }} className="p-1.5 rounded-lg cursor-pointer" style={{ color: 'var(--ios-text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      {!sede.es_principal && (
                        <button onClick={() => {
                          if (confirm(`Eliminar la sede "${sede.nombre}"?`)) {
                            const updated = (config.sedes || []).filter(s => s.id !== sede.id);
                            updateConfig({ sedes: updated });
                          }
                        }} className="p-1.5 rounded-lg cursor-pointer" style={{ color: '#FF3B30' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!config.sedes || config.sedes.length === 0) && (
                <p className="text-[11px] italic text-center py-4" style={{ color: 'var(--ios-text-tertiary)' }}>
                  No hay sucursales configuradas. Agrega una abajo.
                </p>
              )}
            </div>
          </div>

          <div className="admin-card p-4">
            <SectionTitle>{editingSedeId ? 'Editar Sede' : 'Agregar Nueva Sede'}</SectionTitle>
            <div className="flex flex-col gap-3">
              <input type="text" value={sedeForm.nombre} onChange={e => setSedeForm({ ...sedeForm, nombre: e.target.value })}
                className="admin-input" placeholder="Nombre de la sede" />
              <input type="tel" value={sedeForm.telefono} onChange={e => setSedeForm({ ...sedeForm, telefono: e.target.value })}
                className="admin-input" placeholder="Telefono" />
              <input type="tel" value={sedeForm.whatsapp_numero} onChange={e => setSedeForm({ ...sedeForm, whatsapp_numero: e.target.value })}
                className="admin-input" placeholder="WhatsApp (opcional, si difiere del telefono)" />
              <input type="text" value={sedeForm.direccion} onChange={e => setSedeForm({ ...sedeForm, direccion: e.target.value })}
                className="admin-input" placeholder="Direccion" />
              <input type="text" value={sedeForm.horario} onChange={e => setSedeForm({ ...sedeForm, horario: e.target.value })}
                className="admin-input" placeholder="Horario (ej: 8am - 10pm)" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Latitud</FieldLabel>
                  <input type="number" step="any" value={sedeForm.lat || ''} onChange={e => setSedeForm({ ...sedeForm, lat: parseFloat(e.target.value) || 0 })}
                    className="admin-input mt-1" placeholder="10.198300" />
                </div>
                <div>
                  <FieldLabel>Longitud</FieldLabel>
                  <input type="number" step="any" value={sedeForm.lng || ''} onChange={e => setSedeForm({ ...sedeForm, lng: parseFloat(e.target.value) || 0 })}
                    className="admin-input mt-1" placeholder="-68.004400" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (!sedeForm.nombre.trim()) return;
                  const existingSede = editingSedeId ? (config.sedes || []).find(s => s.id === editingSedeId) : null;
                  const nuevaSede: Sede = {
                    id: editingSedeId || `sede-${Date.now()}`,
                    nombre: sedeForm.nombre.trim(),
                    telefono: sedeForm.telefono,
                    whatsapp_numero: sedeForm.whatsapp_numero || undefined,
                    direccion: sedeForm.direccion,
                    horario: sedeForm.horario,
                    coordenadas: { lat: sedeForm.lat, lng: sedeForm.lng },
                    es_principal: existingSede?.es_principal || (config.sedes || []).length === 0,
                    activa: existingSede?.activa ?? true,
                    delivery_mode: existingSede?.delivery_mode,
                    permite_delivery: existingSede?.permite_delivery,
                    permite_pickup: existingSede?.permite_pickup,
                  };
                  const sedes = [...(config.sedes || [])];
                  if (editingSedeId) {
                    const idx = sedes.findIndex(s => s.id === editingSedeId);
                    if (idx >= 0) sedes[idx] = nuevaSede;
                  } else {
                    sedes.push(nuevaSede);
                  }
                  updateConfig({ sedes });
                  setEditingSedeId(null);
                  setSedeForm({ nombre: '', telefono: '', whatsapp_numero: '', direccion: '', horario: '', lat: 0, lng: 0 });
                }} disabled={!sedeForm.nombre.trim()}
                  className="admin-btn flex-1 cursor-pointer disabled:opacity-40">
                  {editingSedeId ? 'Guardar Cambios' : 'Agregar Sede'}
                </button>
                {editingSedeId && (
                  <button onClick={() => { setEditingSedeId(null); setSedeForm({ nombre: '', telefono: '', whatsapp_numero: '', direccion: '', horario: '', lat: 0, lng: 0 }); }}
                    className="admin-btn-secondary admin-btn cursor-pointer">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TiendaSection;
