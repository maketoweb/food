import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { FAQItem } from '../types/store';
import { motion, AnimatePresence } from 'motion/react';

interface FAQSectionProps {
  items: FAQItem[];
  themeColor?: string;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ items, themeColor = '#E31837' }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!items || items.length === 0) return null;

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeColor}15` }}>
          <HelpCircle size={14} style={{ color: themeColor }} />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900">Preguntas Frecuentes</h3>
          <p className="text-[10px] text-zinc-400">Resolvemos tus dudas</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-zinc-100 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
            >
              <span className="text-sm font-semibold text-zinc-800 pr-4">{item.question}</span>
              <motion.div
                animate={{ rotate: openId === item.id ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex-shrink-0"
              >
                <ChevronDown size={16} className="text-zinc-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {openId === item.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="px-4 pb-4">
                    <div className="border-t border-zinc-100 pt-3">
                      <p className="text-sm text-zinc-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-4 p-4 bg-zinc-50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={14} className="text-zinc-500" />
          <span className="text-xs text-zinc-600">¿No encontraste tu respuesta?</span>
        </div>
        <a
          href={`https://wa.me/${('584124976451').replace(/\D/g, '').replace(/^0/, '58')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: themeColor, backgroundColor: `${themeColor}10` }}
        >
          Escríbenos
        </a>
      </div>
    </div>
  );
};
