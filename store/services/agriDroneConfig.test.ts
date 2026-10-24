import { describe, it, expect } from 'vitest';
import { getDefaultAgriDroneConfig } from './agriDroneConfig';

describe('agriDroneConfig', () => {
  it('returns valid default configuration matching brochure specifications', () => {
    const config = getDefaultAgriDroneConfig();

    expect(config.displayName).toBe('Agricultural Spraying Drone');
    expect(config.slug).toBe('agricultural-spraying-drone');
    expect(config.contactEmail).toBe('sales@dronesz.in');

    // Certification
    expect(config.certification.title).toBe('DGCA Type Certified');
    expect(config.certification.status).toBe('Type Certified & Compliant');
    expect(config.certification.regulation).toContain('Rule 8 & 9(3)');
    expect(config.certification.classType).toBe('Medium Class Rotorcraft RPAS');

    // Core Metrics from brochure
    const metricLabels = config.metrics.map(m => `${m.value}${m.unit || ''}`);
    expect(metricLabels).toContain('10L');
    expect(metricLabels).toContain('4Nozzles');
    expect(metricLabels).toContain('30.15kg');
    expect(metricLabels).toContain('23min');
    expect(metricLabels).toContain('1.5km');
    expect(metricLabels).toContain('8.0m/s');

    // Propulsion from brochure
    const propulsionCategory = config.specifications.find(s => s.category.includes('Propulsion'));
    expect(propulsionCategory).toBeDefined();
    const motorSpec = propulsionCategory?.items.find(i => i.label === 'Motors');
    expect(motorSpec?.value).toContain('6 x 2399W');
    const propSpec = propulsionCategory?.items.find(i => i.label === 'Propellers');
    expect(propSpec?.value).toContain('6 x 24-inch');

    // Safety avionics from brochure
    const safetyTitles = config.flightSafetyFeatures.map(f => f.title);
    expect(safetyTitles.some(t => t.includes('Geo-Fencing'))).toBe(true);
    expect(safetyTitles.some(t => t.includes('Detect & Avoid'))).toBe(true);
    expect(safetyTitles.some(t => t.includes('Return to Home'))).toBe(true);
    expect(safetyTitles.some(t => t.includes('Flight Termination'))).toBe(true);
  });
});
