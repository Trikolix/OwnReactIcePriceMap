import { useEffect } from "react";

const MANAGED_ATTR = "data-seo-managed";

function toAbsoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;

  if (typeof window === "undefined") {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${normalizedPath}`;
}

function setDocumentTitle(title) {
  if (!title || typeof document === "undefined") return () => {};

  const previousTitle = document.title;
  document.title = title;

  return () => {
    document.title = previousTitle;
  };
}

function upsertMetaTag(kind, key, content) {
  if (typeof document === "undefined" || !content) return () => {};

  const selector = `meta[${kind}="${key}"]`;
  const existing = document.head.querySelector(selector);

  if (existing) {
    const previousContent = existing.getAttribute("content");
    existing.setAttribute("content", content);
    existing.setAttribute(MANAGED_ATTR, "true");

    return () => {
      if (previousContent === null) {
        existing.removeAttribute("content");
      } else {
        existing.setAttribute("content", previousContent);
      }
      existing.removeAttribute(MANAGED_ATTR);
    };
  }

  const meta = document.createElement("meta");
  meta.setAttribute(kind, key);
  meta.setAttribute("content", content);
  meta.setAttribute(MANAGED_ATTR, "true");
  document.head.appendChild(meta);

  return () => {
    meta.remove();
  };
}

function upsertCanonicalLink(href) {
  if (typeof document === "undefined" || !href) return () => {};

  const absoluteHref = toAbsoluteUrl(href);
  const existing = document.head.querySelector('link[rel="canonical"]');

  if (existing) {
    const previousHref = existing.getAttribute("href");
    existing.setAttribute("href", absoluteHref);
    existing.setAttribute(MANAGED_ATTR, "true");

    return () => {
      if (previousHref === null) {
        existing.removeAttribute("href");
      } else {
        existing.setAttribute("href", previousHref);
      }
      existing.removeAttribute(MANAGED_ATTR);
    };
  }

  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", absoluteHref);
  link.setAttribute(MANAGED_ATTR, "true");
  document.head.appendChild(link);

  return () => {
    link.remove();
  };
}

function appendJsonLd(jsonLd) {
  if (typeof document === "undefined" || !jsonLd) return () => {};

  const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const scripts = items
    .filter(Boolean)
    .map((item) => {
      const script = document.createElement("script");
      script.setAttribute("type", "application/ld+json");
      script.setAttribute(MANAGED_ATTR, "true");
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
      return script;
    });

  return () => {
    scripts.forEach((script) => script.remove());
  };
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  robots = "index,follow",
  ogType = "website",
  ogImage = "/logo512.png",
  jsonLd,
}) {
  useEffect(() => {
    const cleanup = [
      setDocumentTitle(title),
      upsertMetaTag("name", "description", description),
      upsertMetaTag("name", "keywords", Array.isArray(keywords) ? keywords.join(", ") : keywords),
      upsertMetaTag("name", "robots", robots),
      upsertMetaTag("property", "og:title", title),
      upsertMetaTag("property", "og:description", description),
      upsertMetaTag("property", "og:type", ogType),
      upsertMetaTag("property", "og:url", canonical ? toAbsoluteUrl(canonical) : window.location.href),
      upsertMetaTag("property", "og:image", toAbsoluteUrl(ogImage)),
      upsertMetaTag("name", "twitter:card", "summary_large_image"),
      upsertMetaTag("name", "twitter:title", title),
      upsertMetaTag("name", "twitter:description", description),
      upsertMetaTag("name", "twitter:image", toAbsoluteUrl(ogImage)),
      upsertCanonicalLink(canonical),
      appendJsonLd(jsonLd),
    ];

    return () => {
      cleanup.reverse().forEach((fn) => fn());
    };
  }, [canonical, description, jsonLd, keywords, ogImage, ogType, robots, title]);

  return null;
}
