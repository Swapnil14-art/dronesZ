"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MultiFileDropzone } from "../custom/MultiFileDropzone";
import "./drone-builder.css";

export type DroneType = "quad-hex" | "vtol" | "fixed-wing";
export type VideoTransmission = "analog" | "digital-hd" | "cofdm";
export type VideoSetup = "daylight" | "day-night-thermal" | "multispectral-lidar" | "custom-mount";

interface DroneTypeOption {
  id: DroneType;
  name: string;
  badge: string;
  description: string;
  iconSvg: React.ReactNode;
}

const DRONE_TYPES: DroneTypeOption[] = [
  {
    id: "quad-hex",
    name: "Quad / Hexacopter",
    badge: "5–25 kg MTOW · Multi-Rotor",
    description: "Multi-rotor propulsion engineered for precision stationary hovering, high payload capacity, and aggressive wind rejection in close-quarters flight.",
    iconSvg: (
      <svg className="byod-platform-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <circle cx="12" cy="2" r="1.5" />
        <circle cx="12" cy="22" r="1.5" />
        <circle cx="2" cy="12" r="1.5" />
        <circle cx="22" cy="12" r="1.5" />
      </svg>
    ),
  },
  {
    id: "vtol",
    name: "VTOL Platform",
    badge: "Hybrid Airframe · Runway-Free",
    description: "Vertical multi-rotor takeoff combined with high-speed aerodynamic fixed-wing cruise for maximum BVLOS coverage across rugged terrains.",
    iconSvg: (
      <svg className="byod-platform-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 20l8-4 8 4L12 2z" />
        <path d="M12 2v14" />
      </svg>
    ),
  },
  {
    id: "fixed-wing",
    name: "Fixed-Wing",
    badge: "Long Loiter · High Aspect Ratio",
    description: "High-aspect-ratio carbon composite wing structure optimized for prolonged surveillance loiter times and large-scale corridor mapping.",
    iconSvg: (
      <svg className="byod-platform-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20" />
        <path d="M12 2v20" />
        <path d="M7 7l5 5 5-5" />
      </svg>
    ),
  },
];

const PAYLOAD_PRESETS = [
  { label: "0.5 kg (Micro Sensor)", value: 0.5 },
  { label: "1.5 kg (Optical Gimbal)", value: 1.5 },
  { label: "3.5 kg (Dual EO/IR)", value: 3.5 },
  { label: "5.0 kg (Heavy Lift)", value: 5.0 },
  { label: "10.0 kg (Industrial)", value: 10.0 },
  { label: "15.0+ kg (Heavy Transport)", value: 15.0 },
];

const RANGE_PRESETS = [
  { label: "5 km (VLOS)", value: 5 },
  { label: "10 km (Medium Range)", value: 10 },
  { label: "20 km (Extended Range)", value: 20 },
  { label: "35 km (BVLOS)", value: 35 },
  { label: "50+ km (Tactical Link)", value: 50 },
];

const FLIGHT_TIME_PRESETS = [
  { label: "20 mins", value: 20 },
  { label: "30 mins", value: 30 },
  { label: "45 mins", value: 45 },
  { label: "60 mins", value: 60 },
  { label: "90+ mins", value: 90 },
];

const ALTITUDE_PRESETS = [
  { label: "500 m AGL (Standard)", value: 500 },
  { label: "1,000 m AGL (Tactical)", value: 1000 },
  { label: "2,500 m AMSL (High-Relief)", value: 2500 },
  { label: "4,500+ m AMSL (Himalayan Spec)", value: 4500 },
];

const VIDEO_TRANSMISSION_OPTIONS = [
  {
    id: "analog" as VideoTransmission,
    name: "Analog FPV (5.8 GHz)",
    desc: "Zero-latency instantaneous pilot feed, standard definition, rugged reliability.",
  },
  {
    id: "digital-hd" as VideoTransmission,
    name: "Digital HD (Low-Latency)",
    desc: "1080p60 ultra-crisp downlink, digital noise rejection, secure telemetry stream.",
  },
];

const VIDEO_SETUP_OPTIONS = [
  {
    id: "daylight" as VideoSetup,
    name: "Daylight Optical (4K / 30x Zoom)",
    desc: "High-resolution optical daylight sensor for GIS, inspection, and visual tracking.",
  },
  {
    id: "day-night-thermal" as VideoSetup,
    name: "Day / Night Dual (EO + IR Thermal)",
    desc: "Radiometric 640x512 uncooled thermal core + daylight optical zoom with 360° stabilization.",
  },
  {
    id: "multispectral-lidar" as VideoSetup,
    name: "Multi-Spectral / LiDAR Mount",
    desc: "Calibrated vibration-damped bracket and power bus for precision survey sensors.",
  },
];

const APPLICATION_OPTIONS = [
  "Agricultural Spraying & Precision Farming",
  "Border Surveillance & Tactical Reconnaissance",
  "Powerline, Pipeline & Industrial Asset Inspection",
  "GIS Photogrammetry, 3D Mapping & Mining Survey",
  "Emergency Medical & Cargo Logistics Transit",
  "Disaster Management & Search and Rescue (SAR)",
  "Custom Aerospace R&D & Prototype Lab",
];

const Thread = () => (
  <span className="byod-thread">
    <span className="s1" />
    <span className="s2" />
    <span className="s3" />
  </span>
);

export function BuildYourOwnDrone() {
  // Configuration state
  const [droneType, setDroneType] = useState<DroneType>("quad-hex");
  const [payload, setPayload] = useState<number>(5.0);
  const [range, setRange] = useState<number>(20);
  const [flightTime, setFlightTime] = useState<number>(45);
  const [altitude, setAltitude] = useState<number>(1000);
  const [videoTransmission, setVideoTransmission] = useState<VideoTransmission>("digital-hd");
  const [videoSetup, setVideoSetup] = useState<VideoSetup>("day-night-thermal");
  const [application, setApplication] = useState<string>("Industrial Infrastructure & Powerline Inspection");
  const [customNotes, setCustomNotes] = useState<string>("");

  // Customer contact state
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");

  // Attachments state
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Submission state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Selected object labels for summary
  const selectedTypeObj = DRONE_TYPES.find((t) => t.id === droneType) || DRONE_TYPES[0];
  const selectedTxObj = VIDEO_TRANSMISSION_OPTIONS.find((v) => v.id === videoTransmission) || VIDEO_TRANSMISSION_OPTIONS[0];
  const selectedSetupObj = VIDEO_SETUP_OPTIONS.find((s) => s.id === videoSetup) || VIDEO_SETUP_OPTIONS[0];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone.trim()) {
      errors.phone = "Contact number is required";
    } else if (phone.trim().replace(/[\s()-]/g, "").length < 7) {
      errors.phone = "Please enter a valid contact phone number";
    }

    if (payload <= 0) errors.payload = "Payload must be greater than 0 kg";
    if (range <= 0) errors.range = "Range must be greater than 0 km";
    if (flightTime <= 0) errors.flightTime = "Flight time must be greater than 0 mins";
    if (altitude <= 0) errors.altitude = "Altitude must be greater than 0 m";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setSubmitError(null);

    if (!validate()) {
      const firstErrEl = document.querySelector(".byod-field-error");
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Technical specifications payload
      const technicalSpecs = {
        droneType: selectedTypeObj.name,
        droneTypeBadge: selectedTypeObj.badge,
        payloadCapacity: `${payload.toFixed(1)} kg`,
        requiredRange: `${range} km`,
        flightTime: `${flightTime} mins`,
        operatingAltitudeCeiling: `${altitude} m`,
        videoTransmission: selectedTxObj.name,
        videoSetup: selectedSetupObj.name,
        intendedApplication: application,
        organization: organization.trim() || undefined,
        deploymentCity: city.trim() || undefined,
        leadTimeAcknowledged: "8-9 working days",
      };

      // Serialize full technical spec into human-readable summary
      const messageBody = [
        "==================================================",
        "BESPOKE UAV BUILD ENQUIRY — DRONESZ INDIA",
        "==================================================",
        "",
        "--- 1. AIRFRAME & PROPULSION SPECIFICATIONS ---",
        `• Platform Type: ${selectedTypeObj.name} (${selectedTypeObj.badge})`,
        `• Payload Capacity: ${payload} kg`,
        `• Required Range: ${range} km`,
        `• Flight Time / Endurance: ${flightTime} mins`,
        `• Operating Altitude Ceiling: ${altitude} m AGL/AMSL`,
        "",
        "--- 2. AVIONICS & SENSOR SUITE ---",
        `• Video Transmission: ${selectedTxObj.name}`,
        `• Video / Sensor Setup: ${selectedSetupObj.name}`,
        `• Intended Application: ${application}`,
        "",
        "--- 3. CLIENT CREDENTIALS ---",
        `• Client Name: ${name.trim()}`,
        `• Email Address: ${email.trim()}`,
        `• Contact Number: ${phone.trim()}`,
        organization.trim() ? `• Organization / Agency: ${organization.trim()}` : null,
        city.trim() ? `• Target Location: ${city.trim()}` : null,
        "",
        "--- 4. DISPATCH ADVISORY ---",
        "• Production Lead Time: SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS (Acknowledged)",
        "",
        customNotes.trim() ? `--- 5. MISSION NOTES & CUSTOM REQUIREMENTS ---\n${customNotes.trim()}` : null,
        "==================================================",
      ]
        .filter(Boolean)
        .join("\n");

      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("email", email.trim());
      formData.set("phone", phone.trim());
      formData.set("path", "build_your_own_drone");
      formData.set("message", messageBody);
      formData.set("specifications", JSON.stringify(technicalSpecs));
      formData.set("_hp", honeypot);

      for (const f of files) {
        formData.append("files", f);
      }

      const res = await fetch("/api/custom-build", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit custom drone enquiry. Please try again.");
      }

      setSubmittedRef(data?.reference || null);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="byod-page">
        <div className="byod-wrap byod-success-wrap">
          <div className="byod-success-box">
            <div className="byod-success-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="byod-success-title">
              UAV Architecture Enquiry Received<span className="dot">.</span>
            </h2>
            {submittedRef && (
              <div style={{ display: "inline-block", background: "#fef2f2", color: "var(--byod-red, #e52b31)", border: "1px solid rgba(229, 43, 49, 0.3)", fontWeight: 700, padding: "0.35rem 0.85rem", borderRadius: "4px", fontSize: "0.88rem", fontFamily: "var(--byod-mono)", marginBottom: "16px" }}>
                Enquiry Reference #{submittedRef}
              </div>
            )}
            <p className="byod-success-desc">
              Thank you, <strong>{name}</strong>. Your custom drone architecture specification has been forwarded to our aerospace engineering team at the Indore UAV lab. We will review your CAD and mission requirements and reply to <strong>{email}</strong> within 24 business hours.
            </p>

            <div className="byod-shipping-banner" style={{ margin: "0 0 24px 0" }}>
              <div className="byod-shipping-left">
                <svg className="byod-shipping-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <div className="byod-shipping-title">
                    SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS
                  </div>
                  <p className="byod-shipping-desc">
                    Every custom UAV architecture undergoes structural carbon validation, stator balance tuning, and mandatory bench flight-testing before dispatch from our Indore facility.
                  </p>
                </div>
              </div>
            </div>

            <div className="byod-success-specs">
              <div style={{ fontFamily: "var(--byod-mono)", fontSize: "0.76rem", color: "var(--byod-red)", textTransform: "uppercase", marginBottom: "8px" }}>
                {"// Submitted Flight Blueprint"}
              </div>
              <div>• <strong>Platform:</strong> {selectedTypeObj.name} ({selectedTypeObj.badge})</div>
              <div>• <strong>Payload Capacity:</strong> {payload} kg</div>
              <div>• <strong>Operational Range:</strong> {range} km</div>
              <div>• <strong>Flight Time:</strong> {flightTime} minutes</div>
              <div>• <strong>Altitude Ceiling:</strong> {altitude} m AGL</div>
              <div>• <strong>Video Transmission:</strong> {selectedTxObj.name}</div>
              <div>• <strong>Sensor Package:</strong> {selectedSetupObj.name}</div>
              <div>• <strong>Target Application:</strong> {application}</div>
            </div>

            <div className="byod-success-actions">
              <button
                type="button"
                className="byod-btn byod-btn-primary"
                onClick={() => {
                  setIsSubmitted(false);
                  setName("");
                  setEmail("");
                  setPhone("");
                  setOrganization("");
                  setCustomNotes("");
                }}
              >
                Configure Another Architecture
              </button>
              <Link href="/store" className="byod-btn byod-btn-ghost">
                Explore Hardware Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="byod-page">
      {/* ── 1. HERO (Matching /store/parachute p-hero) ── */}
      <section className="byod-hero">
        <div className="byod-wrap byod-hero-grid">
          <div>
            <div className="byod-eyebrow">
              <Thread />
              Bespoke UAV Engineering · Indore Lab
            </div>
            <h1 className="byod-headline">
              Configure your flight platform<span className="dot">.</span>
            </h1>
            <p className="byod-hero-sub">
              From heavy-lift multi-rotors to long-range hybrid VTOLs — specify your mission envelope, flight duration, payload mass, and sensor suites. Engineered, fabricated, and bench flight-tested by DronesZ in Indore.
            </p>
            <div className="byod-hero-cta">
              <a href="#byod-configurator" className="byod-btn byod-btn-primary">
                Configure Architecture
              </a>
              <Link href="/store" className="byod-btn byod-btn-ghost">
                Hardware Catalogue
              </Link>
            </div>
          </div>

          {/* Right Stage Panel (Inspired by Parachute recovery sequence) */}
          <div className="byod-stage-panel">
            <h3>Flight Readiness Sequence</h3>
            <div className="byod-stage-list">
              <div className="byod-stage-item active">
                <span className="dot-marker" />
                <span className="label">01 Platform Geometry</span>
                <span className="desc">{selectedTypeObj.name}</span>
              </div>
              <div className="byod-stage-item active">
                <span className="dot-marker" />
                <span className="label">02 Flight Envelope</span>
                <span className="desc">{payload}kg · {range}km</span>
              </div>
              <div className="byod-stage-item active">
                <span className="dot-marker" />
                <span className="label">03 Avionics &amp; Sensors</span>
                <span className="desc">{selectedTxObj.name.split(" ")[0]} Link</span>
              </div>
              <div className="byod-stage-item">
                <span className="dot-marker" />
                <span className="label">04 Flight Qualification</span>
                <span className="desc">Indore Lab Test</span>
              </div>
            </div>

            {/* Embedded Dispatch Advisory in Hero */}
            <div className="byod-stage-shipping">
              <span className="byod-stage-shipping-badge">
                ⚡ Dispatch Lead Time
              </span>
              <span>
                SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS
              </span>
            </div>
          </div>
        </div>
      </section>
      {/* ── 3. CONFIGURATOR WORKSPACE ── */}
      <section id="byod-configurator" className="byod-section alt">
        <div className="byod-wrap">
          {/* PROMINENT TASTEFUL SHIPPING NOTICE BANNER */}
          <div className="byod-shipping-banner" role="status">
            <div className="byod-shipping-left">
              <svg className="byod-shipping-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <div>
                <div className="byod-shipping-title">
                  SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS
                </div>
                <p className="byod-shipping-desc">
                  Every custom UAV architecture undergoes structural carbon validation, stator balance tuning, and mandatory bench flight-testing in Indore before final customer dispatch.
                </p>
              </div>
            </div>
            <span className="byod-shipping-badge">
              8–9 Days Dispatch Window
            </span>
          </div>

          <div className="byod-workspace">
            {/* ── LEFT: INTERACTIVE CONFIGURATION FORM ── */}
            <form onSubmit={handleSubmit} noValidate>
              {/* SECTION 1: AIRFRAME TYPE */}
              <div className="byod-card">
                <div className="byod-sec-label">Section 01</div>
                <h3 className="byod-card-title">Airframe &amp; Platform Architecture</h3>
                <p className="byod-card-sub">
                  Select the structural flight platform geometry engineered for your target operational theater.
                </p>

                <div className="byod-platform-grid">
                  {DRONE_TYPES.map((type) => {
                    const isSelected = droneType === type.id;
                    return (
                      <div
                        key={type.id}
                        className={`byod-platform-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setDroneType(type.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") setDroneType(type.id);
                        }}
                      >
                        <div className="byod-platform-top">
                          {type.iconSvg}
                          <div className="byod-radio-circle" aria-hidden="true">
                            {isSelected && <div className="byod-radio-dot" />}
                          </div>
                        </div>
                        <div className="byod-platform-name">{type.name}</div>
                        <span className="byod-platform-badge">{type.badge}</span>
                        <p className="byod-platform-desc">{type.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: FLIGHT SPECIFICATIONS */}
              <div className="byod-card">
                <div className="byod-sec-label">Section 02</div>
                <h3 className="byod-card-title">Flight Performance &amp; Capacities</h3>
                <p className="byod-card-sub">
                  Tune payload mass, operational range, mission flight duration, and service ceiling.
                </p>

                {/* Payload Capacity */}
                <div className="byod-spec-row">
                  <div className="byod-spec-head">
                    <span className="byod-spec-label">Payload Capacity</span>
                    <div className="byod-spec-readout">
                      {payload.toFixed(1)}<small>kg</small>
                    </div>
                  </div>

                  <div className="byod-pills">
                    {PAYLOAD_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`byod-pill ${payload === p.value ? "active" : ""}`}
                        onClick={() => setPayload(p.value)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="byod-slider-wrap">
                    <input
                      type="range"
                      min="0.5"
                      max="25.0"
                      step="0.5"
                      value={payload}
                      onChange={(e) => setPayload(parseFloat(e.target.value) || 0.5)}
                      className="byod-slider"
                      aria-label="Payload capacity slider"
                    />
                    <input
                      type="number"
                      min="0.1"
                      max="50.0"
                      step="0.1"
                      value={payload}
                      onChange={(e) => setPayload(parseFloat(e.target.value) || 0.5)}
                      className="byod-num-box"
                      aria-label="Payload numeric input"
                    />
                  </div>
                  {fieldErrors.payload && <div className="byod-field-error">{fieldErrors.payload}</div>}
                </div>

                {/* Operational Range */}
                <div className="byod-spec-row">
                  <div className="byod-spec-head">
                    <span className="byod-spec-label">Required Operational Range</span>
                    <div className="byod-spec-readout">
                      {range}<small>km</small>
                    </div>
                  </div>

                  <div className="byod-pills">
                    {RANGE_PRESETS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        className={`byod-pill ${range === r.value ? "active" : ""}`}
                        onClick={() => setRange(r.value)}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <div className="byod-slider-wrap">
                    <input
                      type="range"
                      min="2"
                      max="80"
                      step="1"
                      value={range}
                      onChange={(e) => setRange(parseInt(e.target.value, 10) || 5)}
                      className="byod-slider"
                      aria-label="Operational range slider"
                    />
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={range}
                      onChange={(e) => setRange(parseInt(e.target.value, 10) || 5)}
                      className="byod-num-box"
                      aria-label="Range numeric input"
                    />
                  </div>
                  {fieldErrors.range && <div className="byod-field-error">{fieldErrors.range}</div>}
                </div>

                {/* Flight Time */}
                <div className="byod-spec-row">
                  <div className="byod-spec-head">
                    <span className="byod-spec-label">Target Flight Time / Endurance</span>
                    <div className="byod-spec-readout">
                      {flightTime}<small>mins</small>
                    </div>
                  </div>

                  <div className="byod-pills">
                    {FLIGHT_TIME_PRESETS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`byod-pill ${flightTime === t.value ? "active" : ""}`}
                        onClick={() => setFlightTime(t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="byod-slider-wrap">
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="5"
                      value={flightTime}
                      onChange={(e) => setFlightTime(parseInt(e.target.value, 10) || 20)}
                      className="byod-slider"
                      aria-label="Flight endurance slider"
                    />
                    <input
                      type="number"
                      min="10"
                      max="240"
                      value={flightTime}
                      onChange={(e) => setFlightTime(parseInt(e.target.value, 10) || 20)}
                      className="byod-num-box"
                      aria-label="Flight endurance numeric input"
                    />
                  </div>
                  {fieldErrors.flightTime && <div className="byod-field-error">{fieldErrors.flightTime}</div>}
                </div>

                {/* Altitude Ceiling */}
                <div className="byod-spec-row">
                  <div className="byod-spec-head">
                    <span className="byod-spec-label">Operating Altitude Ceiling</span>
                    <div className="byod-spec-readout">
                      {altitude.toLocaleString()}<small>m AGL</small>
                    </div>
                  </div>

                  <div className="byod-pills">
                    {ALTITUDE_PRESETS.map((a) => (
                      <button
                        key={a.value}
                        type="button"
                        className={`byod-pill ${altitude === a.value ? "active" : ""}`}
                        onClick={() => setAltitude(a.value)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>

                  <div className="byod-slider-wrap">
                    <input
                      type="range"
                      min="200"
                      max="6000"
                      step="100"
                      value={altitude}
                      onChange={(e) => setAltitude(parseInt(e.target.value, 10) || 500)}
                      className="byod-slider"
                      aria-label="Altitude ceiling slider"
                    />
                    <input
                      type="number"
                      min="100"
                      max="8000"
                      value={altitude}
                      onChange={(e) => setAltitude(parseInt(e.target.value, 10) || 500)}
                      className="byod-num-box"
                      aria-label="Altitude ceiling numeric input"
                    />
                  </div>
                  {fieldErrors.altitude && <div className="byod-field-error">{fieldErrors.altitude}</div>}
                </div>
              </div>

              {/* SECTION 3: AVIONICS & SENSORS */}
              <div className="byod-card">
                <div className="byod-sec-label">Section 03</div>
                <h3 className="byod-card-title">Avionics, Downlink &amp; Vision</h3>
                <p className="byod-card-sub">
                  Select your telemetry downlink protocol and optical/thermal sensor suite.
                </p>

                {/* Video Transmission */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontFamily: "var(--byod-mono)", fontSize: "0.76rem", textTransform: "uppercase", color: "var(--byod-slate)", marginBottom: "8px" }}>
                    Video Transmission Protocol
                  </div>
                  <div className="byod-options-grid">
                    {VIDEO_TRANSMISSION_OPTIONS.map((opt) => (
                      <div
                        key={opt.id}
                        className={`byod-option-card ${videoTransmission === opt.id ? "selected" : ""}`}
                        onClick={() => setVideoTransmission(opt.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") setVideoTransmission(opt.id);
                        }}
                      >
                        <div className="byod-option-title">
                          <span>{opt.name}</span>
                          {videoTransmission === opt.id && (
                            <span style={{ color: "var(--byod-red)", fontSize: "13px" }}>●</span>
                          )}
                        </div>
                        <p className="byod-option-desc">{opt.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Camera / Sensor Setup */}
                <div>
                  <div style={{ fontFamily: "var(--byod-mono)", fontSize: "0.76rem", textTransform: "uppercase", color: "var(--byod-slate)", marginBottom: "8px" }}>
                    Camera &amp; Vision Payload Setup
                  </div>
                  <div className="byod-options-grid">
                    {VIDEO_SETUP_OPTIONS.map((setup) => (
                      <div
                        key={setup.id}
                        className={`byod-option-card ${videoSetup === setup.id ? "selected" : ""}`}
                        onClick={() => setVideoSetup(setup.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") setVideoSetup(setup.id);
                        }}
                      >
                        <div className="byod-option-title">
                          <span>{setup.name}</span>
                          {videoSetup === setup.id && (
                            <span style={{ color: "var(--byod-red)", fontSize: "13px" }}>●</span>
                          )}
                        </div>
                        <p className="byod-option-desc">{setup.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4: MISSION APPLICATION & NOTES */}
              <div className="byod-card">
                <div className="byod-sec-label">Section 04</div>
                <h3 className="byod-card-title">Operational Mission Scope</h3>
                <p className="byod-card-sub">
                  Provide your primary mission requirements so our engineering lab can optimize stator windings and aerodynamic trim.
                </p>

                <div className="byod-input-group" style={{ marginBottom: "20px" }}>
                  <label htmlFor="byod-app-select" className="byod-input-label">
                    Intended Application / Sector
                  </label>
                  <select
                    id="byod-app-select"
                    value={application}
                    onChange={(e) => setApplication(e.target.value)}
                    className="byod-select"
                  >
                    {APPLICATION_OPTIONS.map((app) => (
                      <option key={app} value={app}>
                        {app}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="byod-input-group">
                  <label htmlFor="byod-notes" className="byod-input-label">
                    Specific Mission Requirements &amp; Notes <span style={{ color: "var(--byod-slate)", textTransform: "none" }}>(Optional)</span>
                  </label>
                  <textarea
                    id="byod-notes"
                    rows={4}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Provide details such as target wind tolerance, ambient temperature envelope (-20°C to +55°C), battery chemistry preference, parachute triggers, or specific sensor models..."
                    className="byod-textarea"
                  />
                </div>
              </div>

              {/* SECTION 5: CUSTOMER CREDENTIALS */}
              <div className="byod-card">
                <div className="byod-sec-label">Section 05</div>
                <h3 className="byod-card-title">Client Credentials &amp; Delivery Target</h3>
                <p className="byod-card-sub">
                  Provide your direct contacts so our engineering team can send the feasibility report and quote.
                </p>

                {/* Honeypot field for bot suppression */}
                <input
                  type="text"
                  name="_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="byod-form-grid">
                  <div className="byod-input-group">
                    <label htmlFor="byod-name" className="byod-input-label">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="byod-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                      className="byod-input"
                      required
                    />
                    {fieldErrors.name && <div className="byod-field-error">{fieldErrors.name}</div>}
                  </div>

                  <div className="byod-input-group">
                    <label htmlFor="byod-email" className="byod-input-label">
                      Official Email <span className="req">*</span>
                    </label>
                    <input
                      id="byod-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="byod-input"
                      required
                    />
                    {fieldErrors.email && <div className="byod-field-error">{fieldErrors.email}</div>}
                  </div>

                  <div className="byod-input-group">
                    <label htmlFor="byod-phone" className="byod-input-label">
                      Contact Number <span className="req">*</span>
                    </label>
                    <input
                      id="byod-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98273 44411"
                      className="byod-input"
                      required
                    />
                    {fieldErrors.phone && <div className="byod-field-error">{fieldErrors.phone}</div>}
                  </div>

                  <div className="byod-input-group">
                    <label htmlFor="byod-org" className="byod-input-label">
                      Organization / Agency <span style={{ color: "var(--byod-slate)", textTransform: "none" }}>(Optional)</span>
                    </label>
                    <input
                      id="byod-org"
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. AeroDynamics Pvt Ltd"
                      className="byod-input"
                    />
                  </div>
                </div>

                <div className="byod-input-group" style={{ marginTop: "20px" }}>
                  <label htmlFor="byod-city" className="byod-input-label">
                    Deployment City / State <span style={{ color: "var(--byod-slate)", textTransform: "none" }}>(Optional)</span>
                  </label>
                  <input
                    id="byod-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Indore, Madhya Pradesh"
                    className="byod-input"
                  />
                </div>

                <div style={{ marginTop: "20px" }}>
                  <MultiFileDropzone
                    files={files}
                    onFilesChanged={(newFiles) => {
                      setFiles(newFiles);
                      setAttachmentError(null);
                    }}
                    onError={(err) => setAttachmentError(err)}
                    label="Mission Schematics, Payloads & CAD Attachments (Optional)"
                    hint="STL, STEP, OBJ, DXF, PDF, Images, or ZIP · up to 15 MB per file, 25 MB total"
                  />
                  {attachmentError && (
                    <div className="byod-field-error" style={{ marginTop: "6px" }}>
                      {attachmentError}
                    </div>
                  )}
                </div>
              </div>

              {submitError && (
                <div className="byod-error-banner" role="alert">
                  <strong>Submission Error:</strong> {submitError}
                </div>
              )}
            </form>

            {/* ── RIGHT: STICKY LIVE ARCHITECTURE BLUEPRINT ── */}
            <aside className="byod-summary-panel">
              <h3>{"// Live Architecture Blueprint"}</h3>
              <div className="byod-summary-title">Bespoke UAV Specification</div>

              <div className="byod-spec-list">
                <div className="byod-summary-row">
                  <span className="label">Platform Class</span>
                  <span className="val">{selectedTypeObj.name}</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Target Payload</span>
                  <span className="val">{payload.toFixed(1)} kg</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Operational Range</span>
                  <span className="val">{range} km</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Flight Duration</span>
                  <span className="val">{flightTime} mins</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Service Ceiling</span>
                  <span className="val">{altitude.toLocaleString()} m AGL</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Video Protocol</span>
                  <span className="val" style={{ maxWidth: "160px" }}>{selectedTxObj.name.split(" ")[0]} Link</span>
                </div>
                <div className="byod-summary-row">
                  <span className="label">Sensor Package</span>
                  <span className="val" style={{ maxWidth: "160px" }}>{selectedSetupObj.name.split("(")[0]}</span>
                </div>
              </div>

              {/* Prominent Shipping Notice in Summary */}
              <div className="byod-summary-shipping">
                <div className="byod-summary-shipping-title">
                  Production &amp; Dispatch Window
                </div>
                <p className="byod-summary-shipping-note">
                  <strong>SHIPPING WILL BE INITIATED AFTER 8–9 WORKING DAYS</strong> following aerodynamic qualification and motor balance tuning in Indore.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="byod-btn byod-btn-primary byod-submit-btn"
              >
                {isSubmitting ? "Submitting Configuration..." : "Submit Enquiry →"}
              </button>

              <p className="byod-summary-note">
                Directly forwarded to the DronesZ engineering desk. Response guaranteed within 24 business hours.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
