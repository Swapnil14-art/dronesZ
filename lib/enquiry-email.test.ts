import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatEnquiryEmailSubject,
  formatEnquiryEmailText,
  formatEnquiryEmailHtml,
  sendCartEnquiryEmail,
  setEmailTransportOverride,
  type CartEnquiryDetails,
  type EmailTransport,
} from './enquiry-email';

const mockEnquiry: CartEnquiryDetails = {
  enquiryRef: 'DZ-ENQ-20261028-TEST01',
  customerName: 'Aarav Sharma',
  customerEmail: 'aarav@example.com',
  customerPhone: '+91 98765 43210',
  submittedAt: '2026-10-28T05:30:00.000Z',
  notes: 'Urgent quotation required for agricultural payload testing.',
  totalItems: 5,
  indicativeTotal: 45000,
  items: [
    {
      productId: 101,
      productName: 'DZ-Brushless Motor 2207 1950KV',
      productType: 'Motor',
      quantity: 4,
      price: 2500,
      subtotal: 10000,
    },
    {
      productId: 202,
      productName: 'AeroCarbon 7-inch Drone Frame',
      productType: 'Frame',
      quantity: 1,
      price: 35000,
      subtotal: 35000,
    },
  ],
};

describe('formatEnquiryEmailSubject', () => {
  it('formats subject with reference and customer name', () => {
    const subject = formatEnquiryEmailSubject(mockEnquiry);
    expect(subject).toContain('DZ-ENQ-20261028-TEST01');
    expect(subject).toContain('Aarav Sharma');
    expect(subject).toContain('5 items');
  });
});

describe('formatEnquiryEmailText', () => {
  it('includes all critical customer and product fields', () => {
    const text = formatEnquiryEmailText(mockEnquiry);

    // Reference and Customer info
    expect(text).toContain('DZ-ENQ-20261028-TEST01');
    expect(text).toContain('Aarav Sharma');
    expect(text).toContain('aarav@example.com');
    expect(text).toContain('+91 98765 43210');

    // Notes
    expect(text).toContain('Urgent quotation required for agricultural payload testing.');

    // Products & Quantities
    expect(text).toContain('DZ-Brushless Motor 2207 1950KV');
    expect(text).toContain('Requested Qty:  4 units');
    expect(text).toContain('Indicative Unit:₹2,500');
    expect(text).toContain('AeroCarbon 7-inch Drone Frame');
    expect(text).toContain('Requested Qty:  1 unit');

    // Totals
    expect(text).toContain('5 items');
    expect(text).toContain('₹45,000');
  });

  it('handles absent phone and notes gracefully', () => {
    const minimalEnquiry: CartEnquiryDetails = {
      ...mockEnquiry,
      customerPhone: undefined,
      notes: undefined,
    };
    const text = formatEnquiryEmailText(minimalEnquiry);
    expect(text).toContain('Not provided in profile');
    expect(text).not.toContain('SPECIAL CUSTOMER NOTES');
  });
});

describe('formatEnquiryEmailHtml', () => {
  it('renders valid structured HTML with items table', () => {
    const html = formatEnquiryEmailHtml(mockEnquiry);
    expect(html).toContain('DZ-ENQ-20261028-TEST01');
    expect(html).toContain('Aarav Sharma');
    expect(html).toContain('DZ-Brushless Motor 2207 1950KV');
    expect(html).toContain('AeroCarbon 7-inch Drone Frame');
    expect(html).toContain('<table');
    expect(html).toContain('₹45,000');
  });
});

describe('sendCartEnquiryEmail', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    setEmailTransportOverride(null);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    setEmailTransportOverride(null);
  });

  it('returns failure when neither Resend nor SMTP is configured (never faking delivery)', async () => {
    const result = await sendCartEnquiryEmail(mockEnquiry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Email delivery transport is not configured');
  });

  it('delivers email successfully using a mock transport override', async () => {
    let deliveredPayload: any = null;
    const mockTransport: EmailTransport = {
      name: 'MockTestTransport',
      send: async (options) => {
        deliveredPayload = options;
        return { ok: true, messageId: 'mock-msg-123' };
      },
    };

    setEmailTransportOverride(mockTransport);

    const result = await sendCartEnquiryEmail(mockEnquiry);
    expect(result.ok).toBe(true);
    expect(result.messageId).toBe('mock-msg-123');
    expect(deliveredPayload).not.toBeNull();
    expect(deliveredPayload.to).toContain('sales@dronesz.in');
    expect(deliveredPayload.subject).toContain('DZ-ENQ-20261028-TEST01');
    expect(deliveredPayload.replyTo).toBe('aarav@example.com');
  });

  it('propagates transport errors without swallowing them', async () => {
    const failingTransport: EmailTransport = {
      name: 'FailingMockTransport',
      send: async () => {
        return { ok: false, error: 'Connection to SMTP server timed out after 10000ms' };
      },
    };

    setEmailTransportOverride(failingTransport);

    const result = await sendCartEnquiryEmail(mockEnquiry);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('timed out');
  });
});
