/**
 * Agricultural Spraying Drone Configuration — structured data model.
 *
 * Source of truth: DronesZ Agri drone brochure.
 * Complies with strict naming requirements (descriptive public-facing name only).
 */

export interface AgriDroneHero {
  eyebrow: string;
  headline: string;
  tagline: string;
  subheading: string;
}

export interface MetricBadge {
  value: string;
  unit?: string;
  label: string;
  description: string;
  iconType: 'tank' | 'nozzles' | 'weight' | 'endurance' | 'range' | 'speed' | 'motor' | 'propeller';
}

export interface SpecificationCategory {
  category: string;
  items: { label: string; value: string; note?: string }[];
}

export interface FeatureHighlight {
  title: string;
  description: string;
  badge?: string;
  imageSrc?: string;
}

export interface AgriDroneCertification {
  title: string;
  status: string;
  regulation: string;
  classType: string;
}

export interface AgriDronePageConfig {
  displayName: string;
  slug: string;
  talkToUsUrl: string;
  contactEmail: string;

  hero: AgriDroneHero;
  certification: AgriDroneCertification;
  metrics: MetricBadge[];
  featureHighlights: FeatureHighlight[];
  specifications: SpecificationCategory[];
  flightSafetyFeatures: { title: string; description: string }[];
}

export function getDefaultAgriDroneConfig(): AgriDronePageConfig {
  return {
    displayName: 'Agricultural Spraying Drone',
    slug: 'agricultural-spraying-drone',
    talkToUsUrl: '/contact',
    contactEmail: 'sales@dronesz.in',

    hero: {
      eyebrow: 'DGCA Type Certified · Hexacopter RPAS · Made In India',
      headline: 'Agricultural Spraying Drone',
      tagline: 'Precision Spraying. Increased Yields.',
      subheading:
        'Engineered for maximum agricultural efficiency, precision agrochemical application, and rugged farm operations. Featuring an aerodynamically optimized 10L delivery system and industrial-grade failsafe flight avionics.',
    },

    certification: {
      title: 'DGCA Type Certified',
      status: 'Type Certified & Compliant',
      regulation: 'Issued under Drone Rules 2021 (Rule 8 & 9(3))',
      classType: 'Medium Class Rotorcraft RPAS',
    },

    metrics: [
      {
        value: '10',
        unit: 'L',
        label: 'Tank Capacity',
        description: 'Chemical payload capacity optimized for balanced flight dynamics',
        iconType: 'tank',
      },
      {
        value: '4',
        unit: 'Nozzles',
        label: 'Flat Jet Delivery',
        description: 'Propeller downdraft-aligned spray atomization',
        iconType: 'nozzles',
      },
      {
        value: '30.15',
        unit: 'kg',
        label: 'Max All-Up-Weight',
        description: 'Maximum operational takeoff weight under full load',
        iconType: 'weight',
      },
      {
        value: '23',
        unit: 'min',
        label: 'Endurance (Empty)',
        description: 'Extended flight duration for efficient field turnarounds',
        iconType: 'endurance',
      },
      {
        value: '1.5',
        unit: 'km',
        label: 'Operational Range',
        description: 'Long-range telemetry and pilot control link',
        iconType: 'range',
      },
      {
        value: '8.0',
        unit: 'm/s',
        label: 'Flight Speed',
        description: 'Uniform cruise velocity for consistent swath deposition',
        iconType: 'speed',
      },
    ],

    featureHighlights: [
      {
        title: 'Precision Spraying Architecture',
        description:
          'Equipped with 4 pressure-regulated flat-jet nozzles positioned under the rotor wash to push droplets deep into crop canopies while minimizing chemical drift.',
        badge: '10L Spray System',
        imageSrc: '/agri-drone/tank_feature.png',
      },
      {
        title: 'High-Discharge Flat Jet Nozzles',
        description:
          'Engineered spray assembly delivering fine micron atomization with instantaneous shutoff valves to prevent post-spray dripping and soil over-saturation.',
        badge: '4x Flat Jet Nozzles',
        imageSrc: '/agri-drone/nozzle_feature.png',
      },
      {
        title: 'Heavy-Lift Propulsion Powerhouse',
        description:
          'Driven by 6 high-efficiency 2399W brushless DC motors and 24-inch fixed-pitch carbon propellers, offering substantial lift reserves and motor redundancy in gusty winds.',
        badge: '6 x 2399W BLDC',
        imageSrc: '/agri-drone/drone-flight.png',
      },
      {
        title: 'Compact Design & Quick Deployment',
        description:
          'Robust folding carbon arm mechanism and quick-detach landing gear allow rapid field setup by a two-person crew and transport in standard farm utility vehicles.',
        badge: 'Easy Transport',
        imageSrc: '/agri-drone/compact_drone.png',
      },
    ],

    specifications: [
      {
        category: 'Aircraft Configuration',
        items: [
          { label: 'Platform Type', value: 'Hexacopter (6 Rotorcraft)' },
          { label: 'Classification', value: 'Medium Class Rotorcraft RPAS' },
          { label: 'Max All-Up-Weight (AUW / MTOW)', value: '30.15 kg' },
          { label: 'Payload Tank Capacity', value: '10 Liters' },
          { label: 'Airframe Portability', value: 'Folding arms with quick-lock mechanism' },
        ],
      },
      {
        category: 'Flight Performance',
        items: [
          { label: 'Endurance (Empty Tank)', value: '23 minutes' },
          { label: 'Operational Control Range', value: '1.5 km' },
          { label: 'Operational Flight Speed', value: '8.0 m/s' },
          { label: 'Spray Dispersion Pattern', value: '4 Flat-Jet downdraft nozzles' },
        ],
      },
      {
        category: 'Propulsion Hardware',
        items: [
          { label: 'Motors', value: '6 x 2399W BLDC (Brushless DC Motors)' },
          { label: 'Propellers', value: '6 x 24-inch Fixed Pitch Propellers' },
          { label: 'Propulsion Layout', value: 'Radial Hexacopter symmetrical thrust geometry' },
        ],
      },
      {
        category: 'Regulatory Certification & Compliance',
        items: [
          { label: 'DGCA Certification', value: 'DGCA Type Certified' },
          { label: 'Airworthiness Status', value: 'Type Certified & Compliant' },
          { label: 'Statutory Authority', value: 'Issued under Drone Rules 2021 (Rule 8 & 9(3))' },
          { label: 'Manufacturing Facility', value: 'DronesZ Facilities · Indore, Madhya Pradesh, India' },
        ],
      },
    ],

    flightSafetyFeatures: [
      {
        title: 'Geo-Fencing Protection',
        description: 'Hard-coded multi-satellite boundary limits keep the drone safely within legal agricultural operating perimeters.',
      },
      {
        title: 'Detect & Avoid Collision Mitigation',
        description: 'Active obstacle detection sensors protect the platform from power lines, trees, and field obstacles.',
      },
      {
        title: 'Failsafe Return to Home (RTH)',
        description: 'Automated return and smooth landing on command link loss, low battery threshold, or spray cycle completion.',
      },
      {
        title: 'Autonomous Flight Termination',
        description: 'Certified independent emergency shutdown system complying strictly with DGCA fail-safe airworthiness mandates.',
      },
    ],
  };
}
