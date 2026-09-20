/**
 * Parachute Page Configuration — localStorage-based structured data model.
 *
 * Every field maps 1:1 to a section of the public parachute page so the layout
 * can never break, only the text/data within it changes. Defaults are seeded
 * from parachute-recovery.html.
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ParachuteHero {
  eyebrow: string;
  headline: string;
  subheading: string;
}

export interface LabelDescPair {
  label: string;
  description: string;
}

export interface TitleDescPair {
  title: string;
  description: string;
}

export interface ProductRangeRow {
  mtow: string;
  description: string;
  status: 'In stock' | 'Custom';
  visible: boolean;
}

export interface CaseStudy {
  context: string;
  title: string;
  description: string;
  mtow: string;
  canopy: string;
  descent: string;
  drops: string;
}

export interface CtaBand {
  heading: string;
  subtext: string;
}

export interface RecoveryCallout {
  paragraph1: string;
  paragraph2: string;
}

export interface ParachutePageConfig {
  isEnabled: boolean;
  displayName: string;
  talkToUsUrl: string;

  hero: ParachuteHero;
  recoverySequence: LabelDescPair[]; // fixed 5
  featureStrip: TitleDescPair[];     // fixed 4
  productRange: ProductRangeRow[];   // repeatable, min 1
  engineerChecklist: string[];       // repeatable, min 1
  recoveryCallout: RecoveryCallout;
  caseStudies: CaseStudy[];          // repeatable, min 1
  capabilitiesGrid: TitleDescPair[]; // fixed 6
  integrationProcess: TitleDescPair[]; // fixed 6, auto-numbered 01–06
  whoTags: string[];                 // repeatable, min 1
  ctaBand: CtaBand;
}

// ─── Defaults (seeded from parachute-recovery.html) ──────────────────────────

export function getDefaultParachuteConfig(): ParachutePageConfig {
  return {
    isEnabled: true,
    displayName: 'Parachute systems for drones',
    talkToUsUrl: '/contact',

    hero: {
      eyebrow: 'Parachute recovery systems',
      headline: 'Parachute systems for drones.',
      subheading:
        'DronesZ has partnered with a specialised parachute recovery systems manufacturer to offer engineered recovery solutions for UAVs — from off-the-shelf 5–15\u00A0kg systems to custom builds for higher MTOW platforms.',
    },

    recoverySequence: [
      { label: '01 · Arm', description: 'FC / RC standby' },
      { label: '02 · Detect', description: 'Failure or geofence breach' },
      { label: '03 · Deploy', description: 'Canopy release' },
      { label: '04 · Descend', description: 'Controlled terminal velocity' },
      { label: '05 · Recover', description: 'Platform, payload, mission continue' },
    ],

    featureStrip: [
      { title: 'Enhances platform safety', description: 'Reduces risk to people, assets and operations.' },
      { title: 'Protects payload and investment', description: 'Engineered for reliable deployment.' },
      { title: 'Enables responsible BVLOS', description: 'Supports regulatory compliance and safe scaling.' },
      { title: 'Built for real world missions', description: 'From logistics to defence, surveillance and industrial UAVs.' },
    ],

    productRange: [
      { mtow: '5', description: 'Standard canopy · rapid dispatch.', status: 'In stock', visible: true },
      { mtow: '10', description: 'Field-proven on logistics drones.', status: 'In stock', visible: true },
      { mtow: '15', description: 'Standard canopy · surveillance-tested.', status: 'In stock', visible: true },
      { mtow: '>15', description: 'Sized to airframe MTOW & mission profile.', status: 'Custom', visible: true },
    ],

    engineerChecklist: [
      'Canopy sizing around MTOW, geometry and mission profile',
      'Deployment mechanism and mounting interface',
      'Flight-controller / trigger integration',
      'Auto trigger logic for flight-critical failure scenarios',
      'Manual trigger / RC command integration',
      'Drop-test planning, iteration and integration documentation',
    ],

    recoveryCallout: {
      paragraph1:
        'Final canopy area, deployment arrangement and descent performance are determined from the actual UAV configuration and mission requirements. The figures shown here are representative partner case-study data, not a universal specification.',
      paragraph2:
        'For a project-specific recommendation, share your MTOW, airframe type, dimensions, expected failure modes and mission profile.',
    },

    caseStudies: [
      {
        context: 'Last-mile urban delivery · BVLOS',
        title: 'Logistics drone recovery',
        description:
          'Deployed on a 10\u00A0kg last-mile logistics UAV operating BVLOS over urban corridors. The recovery system was sized for the payload-carrying descent envelope and integrated with the flight controller for autonomous trigger on flight-critical failure.',
        mtow: '10 kg',
        canopy: '4.5 m²',
        descent: '5.2 m/s',
        drops: '12',
      },
      {
        context: 'Multi-hour BVLOS surveillance',
        title: 'Surveillance UAV recovery',
        description:
          'Integrated on a fixed-wing surveillance platform running extended BVLOS missions. A compact deployment mechanism was sized to the airframe geometry, with manual arm / disarm from the ground station.',
        mtow: '12 kg',
        canopy: '5.5 m²',
        descent: '5.6 m/s',
        drops: '8',
      },
      {
        context: 'Mapping and defence prototype',
        title: 'Heavy-lift custom airframe',
        description:
          'A custom canopy was designed and drop-tested for a >20\u00A0kg airframe used across mapping and defence prototype programmes, with deployment sized to keep terminal velocity within the airframe\'s recovery limits.',
        mtow: '22 kg',
        canopy: '8 m²',
        descent: '6.1 m/s',
        drops: '6',
      },
    ],

    capabilitiesGrid: [
      { title: 'Designed & manufactured in-house', description: "India's first parachute designers and manufacturers for UAVs — canopy, deployment and mounting under one roof." },
      { title: 'BVLOS-compliant', description: 'Meets DGCA recovery requirements for beyond-visual-line-of-sight operations.' },
      { title: 'FC integration', description: 'Works with Pixhawk, Cube, ArduPilot and PX4 flight controllers.' },
      { title: 'Auto + manual trigger', description: 'Fires on FC failure, geofence breach, or RC command.' },
      { title: 'Drop-tested', description: 'Every unit inspected and drop-tested before dispatch.' },
      { title: 'Integration support', description: 'Documentation, wiring guides and mission-specific tuning included.' },
    ],

    integrationProcess: [
      { title: 'Airframe assessment', description: 'MTOW, geometry and mission profile review.' },
      { title: 'Sizing calculation', description: 'Canopy area, drag coefficient and terminal-velocity targets.' },
      { title: 'Design & customization', description: 'Canopy pattern, deployment mechanism and mounting bracket.' },
      { title: 'Integration', description: 'Wiring, flight-controller signal mapping and arming logic.' },
      { title: 'Drop test', description: 'Instrumented drop testing, inspection and iteration.' },
      { title: 'Delivery', description: 'Packed unit with integration documentation.' },
    ],

    whoTags: [
      'UAV OEMs',
      'System integrators',
      'Defence & government programmes',
      'Logistics',
      'Mapping',
      'Surveillance',
      'Industrial UAVs',
    ],

    ctaBand: {
      heading: 'Ready to recover, protect and continue the mission?',
      subtext:
        "Share your MTOW, airframe type and mission profile — we'll size the right recovery system for your platform.",
    },
  };
}

// ─── localStorage CRUD ───────────────────────────────────────────────────────

const STORAGE_KEY = 'dronesz_parachute_config';

export function loadParachuteConfig(): ParachutePageConfig {
  if (typeof window === 'undefined') return getDefaultParachuteConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ParachutePageConfig>;
      // Merge with defaults so new fields added later are always present
      return { ...getDefaultParachuteConfig(), ...parsed };
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return getDefaultParachuteConfig();
}

export function saveParachuteConfig(config: ParachutePageConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
