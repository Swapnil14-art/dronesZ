"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/data/site";
import { useLenisScroll } from "@/components/providers/LenisGSAPProvider";
import "./nav.css";

/**
 * Fixed nav. Over the dark cinematic hero it goes transparent with light type; once the hero
 * scrolls away it settles into the solid light-glass treatment for the light sections below.
 * An IntersectionObserver on the hero drives the flip (works through the hero's GSAP pin, which
 * keeps it viewport-filling). No `.hero` on a route (e.g. /contact) → always solid.
 * The "Frames" item is an in-page anchor — on home it scrolls through Lenis to #frames-section;
 * from another route it routes home then anchors.
 */
/**
 * Anchors land the section top at the VIEWPORT top, and the nav is fixed over it — so without this
 * the first 64-71px of every target sits behind the nav. Measured rather than tokenised because the
 * bar's height moves with its own padding across breakpoints. Negative: Lenis adds the offset to the
 * target, so stopping short is what leaves the section clear of the bar.
 */
function navOffset(): number {
  const nav = document.querySelector(".nav");
  return nav ? -nav.getBoundingClientRect().height : 0;
}

export function Nav() {
  const pathname = usePathname();
  const { scrollTo } = useLenisScroll();
  const [overHero, setOverHero] = useState(pathname === "/");

  useEffect(() => {
    const hero = document.querySelector(".hero");
    if (!hero) {
      setOverHero(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  // Landing on home WITH a hash — the cross-route branch of handleAnchor below. The browser's own
  // hash scroll fires before the pinned ScrollTriggers exist, so the document is still short and the
  // target sits far above its final position: #frames-section is near the top and lands ~280px off
  // (looks fine by luck), but #custom-airframes sits below all five pins at ~11.4k px and was missed
  // by thousands. Re-scroll through Lenis after layout settles — the provider refreshes ScrollTrigger
  // on rAF, fonts.ready and load, so wait for load AND fonts, then two frames for pin-spacers to be
  // measured. `immediate` because a multi-thousand-pixel smooth scroll on arrival reads as a glitch.
  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash;
    if (!hash || !document.querySelector(hash)) return;

    let cancelled = false;
    let onLoad: (() => void) | undefined;

    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            onLoad = () => resolve();
            window.addEventListener("load", onLoad, { once: true });
          });
    const fonts =
      "fonts" in document ? document.fonts.ready : Promise.resolve();

    Promise.all([loaded, fonts]).then(() => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled)
            scrollTo(hash, { immediate: true, offset: navOffset() });
        }),
      );
    });

    return () => {
      cancelled = true;
      if (onLoad) window.removeEventListener("load", onLoad);
    };
  }, [pathname, scrollTo]);

  const handleAnchor = (href: string) => {
    // href like "#frames-section"
    if (pathname === "/") {
      scrollTo(href, { offset: navOffset() });
    } else {
      // Navigate home with the hash; the effect above lands it once pins are laid out.
      window.location.href = `/${href}`;
    }
  };

  return (
    <header className="nav" data-over-hero={overHero || undefined}>
      <Link href="/" className="nav__brand" aria-label={`${SITE.name} home`}>
        {/* Official quadcopter mark — stays brand-red on both the dark hero and the
            light sections, so it needs no color flip. alt="" as the link is labelled. */}
        <img
          src="/brand/drone-mark.png"
          alt=""
          width={26}
          height={26}
          className="nav__brand-mark"
        />
        <span className="nav__wordmark">
          Drones<span className="accent">Z</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <ul className="nav__links">
          {NAV.map((item) => {
            const isAnchor = item.href.startsWith("#");
            const isActive = !isAnchor && pathname === item.href;
            return (
              <li key={item.href}>
                {isAnchor ? (
                  <button
                    type="button"
                    className="nav__link"
                    onClick={() => handleAnchor(item.href)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="nav__link"
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
