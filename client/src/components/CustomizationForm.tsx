import React from 'react';
import { CustomizationForm, Tier } from '../types';
import { Sparkles, ArrowLeft, Wand2, User, MapPin, Smile, Gift } from 'lucide-react';

interface CustomizationFormProps {
  selectedTier: Tier;
  form: CustomizationForm;
  onChange: (fields: Partial<CustomizationForm>) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const CustomizationFormComp: React.FC<CustomizationFormProps> = ({
  selectedTier,
  form,
  onChange,
  onBack,
  onContinue
}) => {

  const handleQuickPreset = (preset: Partial<CustomizationForm>) => {
    onChange(preset);
  };

  const isFormValid = form.character_name.trim().length > 0 && form.theme.trim().length > 0;

  return (
    <div className="glass-panel" style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', minHeight: '36px' }}>
          <ArrowLeft size={15} /> Change Tier
        </button>

        <div style={{
          fontSize: '0.78rem',
          padding: '5px 12px',
          borderRadius: '999px',
          background: 'rgba(246, 178, 33, 0.12)',
          color: 'var(--primary-gold)',
          fontWeight: 700
        }}>
          Selected: {selectedTier.name} ({selectedTier.nim_amount} NIM)
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '6px' }}>
          Customize Your Story Concept
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Provide key details to personalize the narrative and AI artwork prompt.
        </p>
      </div>

      {/* Quick Fill Presets Scroll Row */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '14px',
        padding: '14px',
        marginBottom: '24px',
        border: '1px dashed rgba(255, 255, 255, 0.12)'
      }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wand2 size={14} /> Quick Inspiration Presets:
        </div>
        <div className="inspiration-scroll">
          <button
            type="button"
            onClick={() => handleQuickPreset({
              character_name: 'Barnaby the Bear',
              theme: 'Enchanted Whispering Pines',
              tone: 'Heartwarming & Magical',
              special_detail: 'A glowing golden compass'
            })}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            🌲 Barnaby's Forest Quest
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset({
              character_name: 'Captain Luna',
              theme: 'Cosmic Nebula Islands',
              tone: 'Whimsical & Adventurous',
              special_detail: 'A telescope that sees dreams'
            })}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            🚀 Captain Luna's Space Voyage
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset({
              character_name: 'Milo the Cat',
              theme: 'Cozy Raindrop Bakery',
              tone: 'Gentle & Sweet',
              special_detail: 'A pair of tiny blue baker boots'
            })}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              padding: '6px 14px',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            🐱 Milo's Cozy Bakery
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (isFormValid) onContinue(); }}>
        {/* Field 1: Character Name */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="var(--primary-gold)" /> Main Character Name
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Required</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Barnaby the Bear or Maya"
            value={form.character_name}
            onChange={(e) => onChange({ character_name: e.target.value })}
            maxLength={40}
            required
          />
        </div>

        {/* Field 2: Theme / Setting */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="var(--primary-teal)" /> Story Theme & Setting
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Required</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Enchanted Forest, Underwater Coral Kingdom"
            value={form.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            maxLength={60}
            required
          />
        </div>

        {/* Field 3: Story Tone */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smile size={15} color="var(--primary-purple)" /> Story Tone
            </span>
          </label>
          <select
            className="form-select"
            value={form.tone}
            onChange={(e) => onChange({ tone: e.target.value })}
          >
            <option value="Whimsical & Heartwarming">Whimsical & Heartwarming</option>
            <option value="Adventurous & Heroic">Adventurous & Heroic</option>
            <option value="Gentle & Cozy Bedtime">Gentle & Cozy Bedtime</option>
            <option value="Funny & Playful">Funny & Playful</option>
            <option value="Mysterious & Magical">Mysterious & Magical</option>
          </select>
        </div>

        {/* Field 4: Special Detail or Inside Joke */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gift size={15} color="var(--primary-pink)" /> Special Detail or Item (Optional)
            </span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Loves warm cocoa, holds a glowing lantern"
            value={form.special_detail}
            onChange={(e) => onChange({ special_detail: e.target.value })}
            maxLength={80}
          />
        </div>

        <div style={{ marginTop: '28px' }}>
          <button
            type="submit"
            disabled={!isFormValid}
            className="btn-primary"
          >
            <Sparkles size={18} /> Proceed to NIM Payment
          </button>
        </div>
      </form>
    </div>
  );
};
