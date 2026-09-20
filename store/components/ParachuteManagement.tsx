import React, { useState, useEffect } from 'react';
import {
  ParachutePageConfig,
  ProductRangeRow,
  CaseStudy,
  TitleDescPair,
  LabelDescPair,
  loadParachuteConfig,
  saveParachuteConfig,
} from '../services/parachuteConfig';

interface Props {
  token: string;
}

/* ─── Tiny reusable helpers ───────────────────────────────────────────────── */

const SectionHeader: React.FC<{ title: string; open: boolean; toggle: () => void }> = ({ title, open, toggle }) => (
  <div
    onClick={toggle}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.8rem 1rem', background: '#f1f5f9', borderRadius: '0.375rem',
      cursor: 'pointer', marginBottom: open ? '1rem' : '0', marginTop: '1rem',
      border: '1px solid var(--color-outline, rgba(15,23,42,0.08))',
      userSelect: 'none',
    }}
  >
    <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0f172a' }}>
      {title}
    </span>
    <span style={{ fontSize: '18px', color: '#64748b' }}>{open ? '▾' : '▸'}</span>
  </div>
);

const FieldLabel: React.FC<{ text: string }> = ({ text }) => (
  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
    {text}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem',
  fontSize: '14px', color: '#0f172a', background: '#fff', outline: 'none',
  fontFamily: 'inherit',
};

const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical', minHeight: '72px' };

const miniBtn: React.CSSProperties = {
  padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '4px',
  border: '1px solid #e2e8f0', cursor: 'pointer', background: '#f8fafc', color: '#475569',
};

const dangerMiniBtn: React.CSSProperties = { ...miniBtn, borderColor: '#fecaca', color: '#dc2626', background: '#fef2f2' };

/* ─── Main component ─────────────────────────────────────────────────────── */

export const ParachuteManagement: React.FC<Props> = ({ token: _token }) => {
  const [config, setConfig] = useState<ParachutePageConfig>(loadParachuteConfig());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true, recovery: false, features: false, range: false, engineer: false,
    callout: false, cases: false, capabilities: false, process: false, who: false, cta: false,
  });

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => { setConfig(loadParachuteConfig()); }, []);

  const update = (patch: Partial<ParachutePageConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const handleSave = () => {
    saveParachuteConfig(config);
    setSuccessMsg('Parachute page saved successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ─── Array helpers (with minimums enforced) ────────────────────────────
  const addRangeRow = () => update({
    productRange: [...config.productRange, { mtow: '', description: '', status: 'In stock', visible: true }],
  });
  const removeRangeRow = (i: number) => {
    if (config.productRange.length <= 1) return;
    update({ productRange: config.productRange.filter((_, idx) => idx !== i) });
  };
  const moveRange = (i: number, dir: -1 | 1) => {
    const arr = [...config.productRange];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ productRange: arr });
  };
  const updateRange = (i: number, patch: Partial<ProductRangeRow>) => {
    const arr = [...config.productRange];
    arr[i] = { ...arr[i], ...patch };
    update({ productRange: arr });
  };

  const addCase = () => update({
    caseStudies: [...config.caseStudies, { context: '', title: '', description: '', mtow: '', canopy: '', descent: '', drops: '' }],
  });
  const removeCase = (i: number) => {
    if (config.caseStudies.length <= 1) return;
    update({ caseStudies: config.caseStudies.filter((_, idx) => idx !== i) });
  };
  const moveCase = (i: number, dir: -1 | 1) => {
    const arr = [...config.caseStudies];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ caseStudies: arr });
  };
  const updateCase = (i: number, patch: Partial<CaseStudy>) => {
    const arr = [...config.caseStudies];
    arr[i] = { ...arr[i], ...patch };
    update({ caseStudies: arr });
  };

  const addChecklist = () => update({ engineerChecklist: [...config.engineerChecklist, ''] });
  const removeChecklist = (i: number) => {
    if (config.engineerChecklist.length <= 1) return;
    update({ engineerChecklist: config.engineerChecklist.filter((_, idx) => idx !== i) });
  };
  const moveChecklist = (i: number, dir: -1 | 1) => {
    const arr = [...config.engineerChecklist];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ engineerChecklist: arr });
  };

  const addTag = () => update({ whoTags: [...config.whoTags, ''] });
  const removeTag = (i: number) => {
    if (config.whoTags.length <= 1) return;
    update({ whoTags: config.whoTags.filter((_, idx) => idx !== i) });
  };
  const moveTag = (i: number, dir: -1 | 1) => {
    const arr = [...config.whoTags];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ whoTags: arr });
  };

  const updateFixedArray = <T,>(key: keyof ParachutePageConfig, i: number, patch: Partial<T>) => {
    const arr = [...(config[key] as T[])];
    arr[i] = { ...(arr[i] as T), ...patch };
    update({ [key]: arr } as any);
  };

  return (
    <div>
      {/* Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
            🪂 Parachute Page Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
            Manage the Parachute Recovery Systems service page content and visibility.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a
            href="/store/parachute"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-stitch-ghost"
            style={{ fontSize: '12px', padding: '0.5rem 1rem' }}
          >
            Preview Page ↗
          </a>
          <button onClick={handleSave} className="btn-stitch-primary" style={{ fontSize: '12px', padding: '0.6rem 1.5rem' }}>
            Save Changes
          </button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46',
          padding: '0.75rem 1rem', borderRadius: '0.375rem', marginBottom: '1.5rem',
          fontSize: '13px', fontWeight: 600,
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* ═══ Enable toggle + display name ═══ */}
      <div style={{
        background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem',
        padding: '1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FieldLabel text="Page Status" />
            <button
              onClick={() => update({ isEnabled: !config.isEnabled })}
              style={{
                padding: '5px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 700,
                border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
                background: config.isEnabled ? '#ecfdf5' : '#f1f5f9',
                color: config.isEnabled ? '#059669' : '#64748b',
              }}
            >
              {config.isEnabled ? '● LIVE' : '○ HIDDEN'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <FieldLabel text="Display Name (shown on /store tile)" />
            <input
              style={inputStyle}
              value={config.displayName}
              onChange={e => update({ displayName: e.target.value })}
              placeholder="Parachute"
            />
          </div>
          <div>
            <FieldLabel text="Talk-to-us Button URL" />
            <input
              style={inputStyle}
              value={config.talkToUsUrl}
              onChange={e => update({ talkToUsUrl: e.target.value })}
              placeholder="/contact or mailto:..."
            />
          </div>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <SectionHeader title="Hero Section" open={openSections.hero} toggle={() => toggle('hero')} />
      {openSections.hero && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel text="Eyebrow Label" />
            <input style={inputStyle} value={config.hero.eyebrow} onChange={e => update({ hero: { ...config.hero, eyebrow: e.target.value } })} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel text="Headline" />
            <input style={inputStyle} value={config.hero.headline} onChange={e => update({ hero: { ...config.hero, headline: e.target.value } })} />
          </div>
          <div>
            <FieldLabel text="Subheading Paragraph" />
            <textarea style={textareaStyle} value={config.hero.subheading} onChange={e => update({ hero: { ...config.hero, subheading: e.target.value } })} />
          </div>
        </div>
      )}

      {/* ═══ RECOVERY SEQUENCE (5 fixed) ═══ */}
      <SectionHeader title="Recovery Sequence (5 stages)" open={openSections.recovery} toggle={() => toggle('recovery')} />
      {openSections.recovery && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.recoverySequence.map((stage, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: i < 4 ? '0.75rem' : 0, paddingBottom: i < 4 ? '0.75rem' : 0, borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
              <div>
                <FieldLabel text={`Stage ${i + 1} Label`} />
                <input style={inputStyle} value={stage.label} onChange={e => updateFixedArray<LabelDescPair>('recoverySequence', i, { label: e.target.value })} />
              </div>
              <div>
                <FieldLabel text={`Stage ${i + 1} Description`} />
                <input style={inputStyle} value={stage.description} onChange={e => updateFixedArray<LabelDescPair>('recoverySequence', i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ FEATURE STRIP (4 fixed) ═══ */}
      <SectionHeader title="Feature Strip (4 items)" open={openSections.features} toggle={() => toggle('features')} />
      {openSections.features && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.featureStrip.map((feat, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: i < 3 ? '0.75rem' : 0, paddingBottom: i < 3 ? '0.75rem' : 0, borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div>
                <FieldLabel text={`Feature ${i + 1} Title`} />
                <input style={inputStyle} value={feat.title} onChange={e => updateFixedArray<TitleDescPair>('featureStrip', i, { title: e.target.value })} />
              </div>
              <div>
                <FieldLabel text={`Feature ${i + 1} Description`} />
                <input style={inputStyle} value={feat.description} onChange={e => updateFixedArray<TitleDescPair>('featureStrip', i, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ PRODUCT RANGE (repeatable) ═══ */}
      <SectionHeader title={`Product Range (${config.productRange.length} rows)`} open={openSections.range} toggle={() => toggle('range')} />
      {openSections.range && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.productRange.map((row, i) => (
            <div key={i} style={{ padding: '0.75rem', marginBottom: '0.75rem', background: '#fafafa', borderRadius: '0.375rem', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Row {i + 1}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button style={miniBtn} onClick={() => moveRange(i, -1)} disabled={i === 0}>↑</button>
                  <button style={miniBtn} onClick={() => moveRange(i, 1)} disabled={i === config.productRange.length - 1}>↓</button>
                  <button style={dangerMiniBtn} onClick={() => removeRangeRow(i)} disabled={config.productRange.length <= 1} title={config.productRange.length <= 1 ? 'Minimum 1 row required' : 'Remove'}>✕</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 130px 80px', gap: '0.5rem', alignItems: 'end' }}>
                <div><FieldLabel text="MTOW" /><input style={inputStyle} value={row.mtow} onChange={e => updateRange(i, { mtow: e.target.value })} /></div>
                <div><FieldLabel text="Description" /><input style={inputStyle} value={row.description} onChange={e => updateRange(i, { description: e.target.value })} /></div>
                <div>
                  <FieldLabel text="Status" />
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={row.status} onChange={e => updateRange(i, { status: e.target.value as 'In stock' | 'Custom' })}>
                    <option value="In stock">In stock</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <FieldLabel text="Visible" />
                  <button
                    onClick={() => updateRange(i, { visible: !row.visible })}
                    style={{ ...miniBtn, width: '100%', background: row.visible ? '#ecfdf5' : '#f1f5f9', color: row.visible ? '#059669' : '#94a3b8', borderColor: row.visible ? '#a7f3d0' : '#e2e8f0' }}
                  >
                    {row.visible ? 'Yes' : 'No'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addRangeRow} style={{ ...miniBtn, marginTop: '0.5rem' }}>+ Add Row</button>
        </div>
      )}

      {/* ═══ ENGINEER CHECKLIST (repeatable) ═══ */}
      <SectionHeader title={`Engineer Checklist (${config.engineerChecklist.length} items)`} open={openSections.engineer} toggle={() => toggle('engineer')} />
      {openSections.engineer && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.engineerChecklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, flex: 1 }} value={item} onChange={e => { const arr = [...config.engineerChecklist]; arr[i] = e.target.value; update({ engineerChecklist: arr }); }} />
              <button style={miniBtn} onClick={() => moveChecklist(i, -1)} disabled={i === 0}>↑</button>
              <button style={miniBtn} onClick={() => moveChecklist(i, 1)} disabled={i === config.engineerChecklist.length - 1}>↓</button>
              <button style={dangerMiniBtn} onClick={() => removeChecklist(i)} disabled={config.engineerChecklist.length <= 1}>✕</button>
            </div>
          ))}
          <button onClick={addChecklist} style={{ ...miniBtn, marginTop: '0.25rem' }}>+ Add Item</button>
        </div>
      )}

      {/* ═══ RECOVERY CALLOUT ═══ */}
      <SectionHeader title="Recovery Performance Callout" open={openSections.callout} toggle={() => toggle('callout')} />
      {openSections.callout && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel text="Paragraph 1" />
            <textarea style={textareaStyle} value={config.recoveryCallout.paragraph1} onChange={e => update({ recoveryCallout: { ...config.recoveryCallout, paragraph1: e.target.value } })} />
          </div>
          <div>
            <FieldLabel text="Paragraph 2" />
            <textarea style={textareaStyle} value={config.recoveryCallout.paragraph2} onChange={e => update({ recoveryCallout: { ...config.recoveryCallout, paragraph2: e.target.value } })} />
          </div>
        </div>
      )}

      {/* ═══ CASE STUDIES (repeatable) ═══ */}
      <SectionHeader title={`Case Studies (${config.caseStudies.length})`} open={openSections.cases} toggle={() => toggle('cases')} />
      {openSections.cases && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.caseStudies.map((cs, i) => (
            <div key={i} style={{ padding: '1rem', marginBottom: '1rem', background: '#fafafa', borderRadius: '0.375rem', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Case Study {i + 1}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button style={miniBtn} onClick={() => moveCase(i, -1)} disabled={i === 0}>↑</button>
                  <button style={miniBtn} onClick={() => moveCase(i, 1)} disabled={i === config.caseStudies.length - 1}>↓</button>
                  <button style={dangerMiniBtn} onClick={() => removeCase(i)} disabled={config.caseStudies.length <= 1}>✕</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div><FieldLabel text="Context Label" /><input style={inputStyle} value={cs.context} onChange={e => updateCase(i, { context: e.target.value })} /></div>
                <div><FieldLabel text="Title" /><input style={inputStyle} value={cs.title} onChange={e => updateCase(i, { title: e.target.value })} /></div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <FieldLabel text="Description" />
                <textarea style={textareaStyle} value={cs.description} onChange={e => updateCase(i, { description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <div><FieldLabel text="MTOW" /><input style={inputStyle} value={cs.mtow} onChange={e => updateCase(i, { mtow: e.target.value })} /></div>
                <div><FieldLabel text="Canopy" /><input style={inputStyle} value={cs.canopy} onChange={e => updateCase(i, { canopy: e.target.value })} /></div>
                <div><FieldLabel text="Descent" /><input style={inputStyle} value={cs.descent} onChange={e => updateCase(i, { descent: e.target.value })} /></div>
                <div><FieldLabel text="Drops" /><input style={inputStyle} value={cs.drops} onChange={e => updateCase(i, { drops: e.target.value })} /></div>
              </div>
            </div>
          ))}
          <button onClick={addCase} style={{ ...miniBtn, marginTop: '0.25rem' }}>+ Add Case Study</button>
        </div>
      )}

      {/* ═══ CAPABILITIES GRID (6 fixed) ═══ */}
      <SectionHeader title="Capabilities Grid (6 items)" open={openSections.capabilities} toggle={() => toggle('capabilities')} />
      {openSections.capabilities && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.capabilitiesGrid.map((cap, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: i < 5 ? '0.75rem' : 0, paddingBottom: i < 5 ? '0.75rem' : 0, borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none' }}>
              <div><FieldLabel text={`Capability ${i + 1} Title`} /><input style={inputStyle} value={cap.title} onChange={e => updateFixedArray<TitleDescPair>('capabilitiesGrid', i, { title: e.target.value })} /></div>
              <div><FieldLabel text={`Capability ${i + 1} Description`} /><input style={inputStyle} value={cap.description} onChange={e => updateFixedArray<TitleDescPair>('capabilitiesGrid', i, { description: e.target.value })} /></div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ INTEGRATION PROCESS (6 fixed, auto-numbered) ═══ */}
      <SectionHeader title="Integration Process (6 steps, auto-numbered 01–06)" open={openSections.process} toggle={() => toggle('process')} />
      {openSections.process && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.integrationProcess.map((step, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '0.75rem', marginBottom: i < 5 ? '0.75rem' : 0, paddingBottom: i < 5 ? '0.75rem' : 0, borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none', alignItems: 'end' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', fontFamily: 'monospace', paddingBottom: '0.6rem' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div><FieldLabel text="Title" /><input style={inputStyle} value={step.title} onChange={e => updateFixedArray<TitleDescPair>('integrationProcess', i, { title: e.target.value })} /></div>
              <div><FieldLabel text="Description" /><input style={inputStyle} value={step.description} onChange={e => updateFixedArray<TitleDescPair>('integrationProcess', i, { description: e.target.value })} /></div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ WHO TAGS (repeatable) ═══ */}
      <SectionHeader title={`Who This Is For (${config.whoTags.length} tags)`} open={openSections.who} toggle={() => toggle('who')} />
      {openSections.who && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          {config.whoTags.map((tag, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, flex: 1 }} value={tag} onChange={e => { const arr = [...config.whoTags]; arr[i] = e.target.value; update({ whoTags: arr }); }} placeholder="Tag label" />
              <button style={miniBtn} onClick={() => moveTag(i, -1)} disabled={i === 0}>↑</button>
              <button style={miniBtn} onClick={() => moveTag(i, 1)} disabled={i === config.whoTags.length - 1}>↓</button>
              <button style={dangerMiniBtn} onClick={() => removeTag(i)} disabled={config.whoTags.length <= 1}>✕</button>
            </div>
          ))}
          <button onClick={addTag} style={{ ...miniBtn, marginTop: '0.25rem' }}>+ Add Tag</button>
        </div>
      )}

      {/* ═══ CTA BAND ═══ */}
      <SectionHeader title="Closing CTA Band" open={openSections.cta} toggle={() => toggle('cta')} />
      {openSections.cta && (
        <div style={{ background: '#fff', border: '1px solid var(--color-outline)', borderRadius: '0.5rem', padding: '1.25rem', marginBottom: '0.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <FieldLabel text="Heading" />
            <input style={inputStyle} value={config.ctaBand.heading} onChange={e => update({ ctaBand: { ...config.ctaBand, heading: e.target.value } })} />
          </div>
          <div>
            <FieldLabel text="Subtext" />
            <textarea style={textareaStyle} value={config.ctaBand.subtext} onChange={e => update({ ctaBand: { ...config.ctaBand, subtext: e.target.value } })} />
          </div>
        </div>
      )}

      {/* Bottom save */}
      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} className="btn-stitch-primary" style={{ fontSize: '12px', padding: '0.6rem 2rem' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
};
