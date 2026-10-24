import { SITE, CONTACT, FOOTER } from "@/data/site";
import "@/components/sections.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand-col">
          <div className="footer__brand">
            <img
              src="/brand/drone-mark.png"
              alt=""
              width={30}
              height={30}
              className="footer__brand-mark"
            />
            <span className="footer__wordmark">
              Drones<span className="accent">Z</span>
            </span>
          </div>
          <p className="footer__blurb">{FOOTER.blurb}</p>

          {/* National Capability Badges */}
          <div
            className="footer__indigenous-row"
            aria-label="National Manufacturing & Indigenous Technology"
          >
            <div className="footer__indigenous-pill">
              <svg
                width="18"
                height="13"
                viewBox="0 0 24 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="footer__flag-svg"
                role="img"
                aria-label="Flag of India"
              >
                <rect width="24" height="5.33" fill="#FF9933" rx="1.5" />
                <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
                <rect y="10.66" width="24" height="5.33" fill="#138808" rx="1.5" />
                <circle
                  cx="12"
                  cy="8"
                  r="2.1"
                  stroke="#000080"
                  strokeWidth="0.6"
                  fill="none"
                />
                <circle cx="12" cy="8" r="0.6" fill="#000080" />
              </svg>
              <span>Made in India</span>
            </div>

            <div className="footer__indigenous-pill">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="footer__pill-icon"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Manufactured in India</span>
            </div>

            <div className="footer__indigenous-pill">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="footer__pill-icon"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 9h6v6H9z" />
                <path d="M3 9h2" />
                <path d="M3 15h2" />
                <path d="M21 9h-2" />
                <path d="M21 15h-2" />
                <path d="M9 3v2" />
                <path d="M15 3v2" />
                <path d="M9 21v-2" />
                <path d="M15 21v-2" />
              </svg>
              <span>Indigenous Technology</span>
            </div>
          </div>
        </div>

        <div className="footer__meta">
          <p className="footer__meta-legal">{CONTACT.legalName}</p>
          <p>{CONTACT.address}</p>
          <p>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
          <p>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
              {CONTACT.phone}
            </a>
          </p>
        </div>
      </div>

      <div className="footer__bottom">
        <span className="footer__aatmanirbhar">
          Aatmanirbhar Bharat • Aerospace &amp; Defence Multirotor Systems
        </span>
        <span className="footer__copyright">{FOOTER.copyright}</span>
      </div>
    </footer>
  );
}
