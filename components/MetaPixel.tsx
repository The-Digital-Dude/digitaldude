"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, pageview, event, customEvent, getOrSetFbc, getOrSetFbp } from "@/lib/metaPixel";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  const isInternalRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/rep") ||
    pathname?.startsWith("/portal");

  // Initialize parameter builder immediately on mount for fbc/fbp capture
  useEffect(() => {
    if (isInternalRoute) return;
    getOrSetFbc();
    getOrSetFbp();
  }, [isInternalRoute]);

  // Track PageView on initial mount and whenever client-side route changes
  useEffect(() => {
    if (isInternalRoute) return;
    getOrSetFbc();
    getOrSetFbp();

    const searchString = searchParams ? searchParams.toString() : "";
    const fullPath = searchString ? `${pathname}?${searchString}` : pathname;

    pageview({
      page_path: fullPath,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });

    // Also trigger ViewContent for specific key pages
    if (pathname.startsWith("/careers")) {
      event("ViewContent", {
        content_name: "Careers & Jobs",
        content_category: "Recruitment",
        page_path: fullPath,
      });
    } else if (pathname.startsWith("/work") || pathname.startsWith("/case-studies")) {
      event("ViewContent", {
        content_name: "Case Studies & Portfolio",
        content_category: "Work",
        page_path: fullPath,
      });
    } else if (pathname.startsWith("/services")) {
      event("ViewContent", {
        content_name: "Services & Architecture",
        content_category: "Services",
        page_path: fullPath,
      });
    }

    isFirstRender.current = false;
  }, [pathname, searchParams, isInternalRoute]);

  // Global intelligent click event tracker for CTAs, navigation links, and contact actions
  useEffect(() => {
    if (isInternalRoute) return;
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find closest anchor or button
      const interactiveEl = target.closest("a, button") as HTMLAnchorElement | HTMLButtonElement | null;
      if (!interactiveEl) return;

      const tagName = interactiveEl.tagName.toLowerCase();
      const textContent = (interactiveEl.innerText || interactiveEl.textContent || "").trim().slice(0, 80);
      const href = (interactiveEl as HTMLAnchorElement).href || interactiveEl.getAttribute("href") || "";

      // 1. Detect Contact / Booking clicks
      if (
        href.includes("/contact") ||
        href.includes("/book") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.includes("whatsapp.com") ||
        href.includes("calendar.app.google")
      ) {
        event("Contact", {
          content_name: textContent || "Contact Link",
          destination: href,
          page_path: pathname,
        });
        return;
      }

      // 2. Detect Job Application CTA clicks
      if (
        href.includes("/careers/") ||
        href.includes("/apply") ||
        textContent.toLowerCase().includes("apply now") ||
        textContent.toLowerCase().includes("apply for role")
      ) {
        event("ViewContent", {
          content_name: textContent || "Apply for Role",
          content_category: "Job Application",
          destination: href,
        });
        return;
      }

      // 3. Detect Primary CTA Button clicks
      if (
        tagName === "button" ||
        interactiveEl.classList.contains("bg-purple") ||
        interactiveEl.classList.contains("btn") ||
        interactiveEl.getAttribute("data-track-cta") === "true"
      ) {
        if (textContent.length > 0 && textContent.length < 50) {
          customEvent("ClickCTA", {
            button_text: textContent,
            destination: href || undefined,
            page_path: pathname,
          });
        }
      }
    }

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, [pathname, isInternalRoute]);

  return null;
}

export function MetaPixel() {
  if (!META_PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
          `,
        }}
      />
      <Suspense fallback={null}>
        <MetaPixelTracker />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
