import React, { useState, useRef } from 'react';
import { useApp } from '../../../store/AppContext';
import { uploadFileToStorage, compressImage } from '../../../store/supabaseClient';
import { FAQItem } from '../../../types/store';
import {
  Image, Type, Palette, Search, HelpCircle, Share2, FileText,
  Plus, Trash2, X, Check, Upload, ChevronUp, ChevronDown, Globe, MapPin
} from 'lucide-react';

const ContentSection: React.FC = () => {
  const { config, updateConfig } = useApp();
  const themeColor = config.theme_color || '#007AFF';

  const [activeTab, setActiveTab] = useState<'identity' | 'colors' | 'banners' | 'texts' | 'seo' | 'faq' | 'social'>('identity');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState<number | null>(null);

  const tabs = [
    { id: 'identity' as const, label: 'Identidad', icon: Type },
    { id: 'colors' as const, label: 'Colores', icon: Palette },
    { id: 'banners' as const, label: 'Banners', icon: Image },
    { id: 'texts' as const, label: 'Textos', icon: FileText },
    { id: 'seo' as const, label: 'SEO', icon: Search },
    { id: 'faq' as const, label: 'FAQ', icon: HelpCircle },
    { id: 'social' as const, label: 'Redes', icon: Share2 },
  ];

  const handleAddFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    const newFaq: FAQItem = { id: `faq-${Date.now()}`, question: faqQuestion.trim(), answer: faqAnswer.trim() };
    updateConfig({ faq_items: [...(config.faq_items || []), newFaq] });
    setFaqQuestion(''); setFaqAnswer('');
  };

  const handleEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id); setFaqQuestion(faq.question); setFaqAnswer(faq.answer);
  };

  const handleSaveEditFaq = () => {
    if (!editingFaqId || !faqQuestion.trim() || !faqAnswer.trim()) return;
    updateConfig({
      faq_items: (config.faq_items || []).map(f =>
        f.id === editingFaqId ? { ...f, question: faqQuestion.trim(), answer: faqAnswer.trim() } : f
      )
    });
    setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer('');
  };

  const handleDeleteFaq = (id: string) => {
    updateConfig({ faq_items: (config.faq_items || []).filter(f => f.id !== id) });
  };

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

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer touch-target"
              style={{
                background: isActive ? themeColor : 'var(--ios-card)',
                color: isActive ? '#FFFFFF' : 'var(--ios-text-secondary)',
                border: `1px solid ${isActive ? themeColor : 'var(--ios-border)'}`,
              }}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Identity Tab */}
      {activeTab === 'identity' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Logo</p>
            <div className="flex items-center gap-4">
              {config.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-16 h-16 rounded-2xl object-cover" style={{ border: '2px solid var(--ios-border)' }} />
              ) : (
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: themeColor }}>
                  {config.site_nombre?.[0] || 'A'}
                </div>
              )}
              <div className="flex-1">
                <input type="text" value={config.logo_url || ''} onChange={e => updateConfig({ logo_url: e.target.value })}
                  className="admin-input mb-2" placeholder="URL del logo" />
                <p className="text-xs" style={{ color: 'var(--ios-text-secondary)' }}>Pega la URL o sube una imagen</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Nombre del Sitio</p>
            <input type="text" value={config.site_nombre} onChange={e => updateConfig({ site_nombre: e.target.value })}
              className="admin-input" placeholder="Mi Restaurante" />
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Mensaje de Bienvenida</p>
            <textarea value={config.mensaje_bienvenida || ''} onChange={e => updateConfig({ mensaje_bienvenida: e.target.value })}
              className="admin-input" rows={3} placeholder="Describe tu restaurante..." style={{ resize: 'none' }} />
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Tipografía del Sitio</p>
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
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Color Primario</p>
            <div className="flex items-center gap-3">
              <input type="color" value={config.theme_color || '#FF6B35'} onChange={e => updateConfig({ theme_color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer" style={{ border: 'none', padding: 0 }} />
              <input type="text" value={config.theme_color || '#FF6B35'} onChange={e => updateConfig({ theme_color: e.target.value })}
                className="admin-input flex-1 font-mono" />
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Color Secundario</p>
            <div className="flex items-center gap-3">
              <input type="color" value={config.secondary_color || '#1A1A2E'} onChange={e => updateConfig({ secondary_color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer" style={{ border: 'none', padding: 0 }} />
              <input type="text" value={config.secondary_color || '#1A1A2E'} onChange={e => updateConfig({ secondary_color: e.target.value })}
                className="admin-input flex-1 font-mono" />
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Color de Acento</p>
            <div className="flex items-center gap-3">
              <input type="color" value={config.accent_color || '#FF6B35'} onChange={e => updateConfig({ accent_color: e.target.value })}
                className="w-12 h-12 rounded-xl cursor-pointer" style={{ border: 'none', padding: 0 }} />
              <input type="text" value={config.accent_color || '#FF6B35'} onChange={e => updateConfig({ accent_color: e.target.value })}
                className="admin-input flex-1 font-mono" />
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Preview</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ios-border)' }}>
              <div className="p-4" style={{ background: config.theme_color || '#FF6B35' }}>
                <p className="text-white font-bold text-lg">{config.site_nombre || 'Mi Tienda'}</p>
                <p className="text-white/80 text-sm">{config.mensaje_bienvenida?.substring(0, 60) || 'Bienvenido...'}</p>
              </div>
              <div className="p-4" style={{ background: config.secondary_color || '#1A1A2E' }}>
                <p className="text-white/80 text-sm">Footer de ejemplo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="flex flex-col gap-4">
          {(config.banners || []).map((banner, index) => (
            <div key={index} className="admin-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="admin-label">Banner {index + 1}</p>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveBanner(index, 'up')} disabled={index === 0}
                    className="p-1.5 rounded-lg disabled:opacity-30" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => handleMoveBanner(index, 'down')} disabled={index === (config.banners?.length || 0) - 1}
                    className="p-1.5 rounded-lg disabled:opacity-30" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                    <ChevronDown size={14} />
                  </button>
                  <button onClick={() => handleRemoveBanner(index)}
                    className="p-1.5 rounded-lg" style={{ background: '#FF3B3015', color: '#FF3B30' }}>
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
                  className="admin-btn flex-1 flex items-center justify-center gap-2 text-sm" style={{ padding: '10px' }}>
                  <Upload size={14} /> Subir
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
            Formatos: JPG, PNG, GIF · Tamaño recomendado: 1200x600px
          </p>
        </div>
      )}

      {/* Texts Tab */}
      {activeTab === 'texts' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">Sección Hero (Home)</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Título Principal (H1)</label>
                <input type="text" value={config.hero_title || ''} onChange={e => updateConfig({ hero_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Pide Tu Comida Favorita" />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Subtítulo</label>
                <input type="text" value={config.hero_subtitle || ''} onChange={e => updateConfig({ hero_subtitle: e.target.value })}
                  className="admin-input mt-1" placeholder="Delivery express en minutos" />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Texto del Botón CTA</label>
                <input type="text" value={config.hero_cta_text || ''} onChange={e => updateConfig({ hero_cta_text: e.target.value })}
                  className="admin-input mt-1" placeholder="Ver Menú" />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Títulos de Secciones</p>
            <div className="flex flex-col gap-3">
              {[
                { key: 'section_promos_title', label: 'Promociones', placeholder: 'Promociones Especiales' },
                { key: 'section_new_title', label: 'Novedades', placeholder: 'Lo Nuevo del Menú' },
                { key: 'section_bestseller_title', label: 'Más Vendidos', placeholder: 'Lo Que Todos Piden' },
                { key: 'section_rewards_title', label: 'Recompensas', placeholder: 'Únete a Recompensas' },
              ].map(item => (
                <div key={item.key}>
                  <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>{item.label}</label>
                  <input type="text" value={(config as any)[item.key] || ''} onChange={e => updateConfig({ [item.key]: e.target.value })}
                    className="admin-input mt-1" placeholder={item.placeholder} />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Footer</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Texto del Footer</label>
                <textarea value={config.footer_text || ''} onChange={e => updateConfig({ footer_text: e.target.value })}
                  className="admin-input mt-1" rows={2} placeholder="Tu restaurante favorito..." style={{ resize: 'none' }} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Copyright</label>
                <input type="text" value={config.footer_copyright || ''} onChange={e => updateConfig({ footer_copyright: e.target.value })}
                  className="admin-input mt-1" placeholder="© 2025 Mi Restaurante" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">SEO - Página Principal</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Título (title)</label>
                <input type="text" value={config.seo_home_title || ''} onChange={e => updateConfig({ seo_home_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Mi Restaurante - Delivery de Comida" />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Descripción (meta description)</label>
                <textarea value={config.seo_home_description || ''} onChange={e => updateConfig({ seo_home_description: e.target.value })}
                  className="admin-input mt-1" rows={3} placeholder="Pide tu comida favorita con delivery express..." style={{ resize: 'none' }} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Palabras clave (keywords)</label>
                <input type="text" value={config.seo_home_keywords || ''} onChange={e => updateConfig({ seo_home_keywords: e.target.value })}
                  className="admin-input mt-1" placeholder="restaurante, delivery, comida, hamburguesas" />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">SEO - Catálogo</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Título</label>
                <input type="text" value={config.seo_catalog_title || ''} onChange={e => updateConfig({ seo_catalog_title: e.target.value })}
                  className="admin-input mt-1" placeholder="Menú y Precios | Mi Restaurante" />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Descripción</label>
                <textarea value={config.seo_catalog_description || ''} onChange={e => updateConfig({ seo_catalog_description: e.target.value })}
                  className="admin-input mt-1" rows={2} placeholder="Explora nuestro menú completo..." style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          <div className="admin-card p-4">
            <p className="admin-label mb-3">Schema JSON-LD</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Tipo</label>
                <select value={config.jsonld_type || 'Restaurant'} onChange={e => updateConfig({ jsonld_type: e.target.value })}
                  className="admin-input mt-1">
                  <option value="Restaurant">Restaurant</option>
                  <option value="FoodEstablishment">Food Establishment</option>
                  <option value="FastFoodRestaurant">Fast Food Restaurant</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: 'var(--ios-text-secondary)' }}>Rango de Precios</label>
                <input type="text" value={config.jsonld_priceRange || '$$'} onChange={e => updateConfig({ jsonld_priceRange: e.target.value })}
                  className="admin-input mt-1" placeholder="$$" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="flex flex-col gap-4">
          <div className="admin-card p-4">
            <p className="admin-label mb-3">{editingFaqId ? 'Editar Pregunta' : 'Nueva Pregunta'}</p>
            <div className="flex flex-col gap-3">
              <input type="text" value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                className="admin-input" placeholder="¿Hacen delivery?" />
              <textarea value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)}
                className="admin-input" rows={3} placeholder="Sí, hacemos delivery..." style={{ resize: 'none' }} />
              <div className="flex gap-2">
                {editingFaqId ? (
                  <>
                    <button onClick={handleSaveEditFaq} className="admin-btn flex-1 flex items-center justify-center gap-2">
                      <Check size={16} /> Guardar
                    </button>
                    <button onClick={() => { setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer(''); }}
                      className="admin-btn-secondary admin-btn flex-1 flex items-center justify-center gap-2">
                      <X size={16} /> Cancelar
                    </button>
                  </>
                ) : (
                  <button onClick={handleAddFaq} disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                    className="admin-btn flex items-center justify-center gap-2 disabled:opacity-40">
                    <Plus size={16} /> Agregar
                  </button>
                )}
              </div>
            </div>
          </div>

          {(config.faq_items || []).map(faq => (
            <div key={faq.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>{faq.question}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--ios-text-secondary)' }}>{faq.answer}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEditFaq(faq)} className="p-2 rounded-xl" style={{ background: 'var(--ios-bg)', color: 'var(--ios-text-secondary)' }}>
                    <FileText size={14} />
                  </button>
                  <button onClick={() => handleDeleteFaq(faq.id)} className="p-2 rounded-xl" style={{ background: '#FF3B3015', color: '#FF3B30' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Social Tab */}
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
              <label className="admin-label">{item.label}</label>
              <input type="url" value={(config as any)[item.key] || ''}
                onChange={e => updateConfig({ [item.key]: e.target.value })}
                className="admin-input mt-2" placeholder={item.placeholder} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentSection;
