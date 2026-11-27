import type { CSSProperties } from "react";
import { HEADING_FONTS, onColor, type SiteContent } from "@/lib/content";

export function themeVars(c: SiteContent): CSSProperties {
  const a = c.appearance;
  const bg = a.background;
  const vars: Record<string, string> = {
    "--bg": a.bgColor,
    "--accent": a.accentColor,
    "--on-accent": onColor(a.accentColor),
    "--card-alpha": String(a.cardOpacity),
    "--overlay": String(a.overlay),
    "--heading-font": HEADING_FONTS[c.general.headingFont].cssVar,
    "--pattern": `url(/themes/${bg.tree}-pattern.svg)`,
  };
  if (bg.kind === "wallpaper") vars["--bg-image"] = `url(/themes/${bg.tree}-wallpaper.svg)`;
  if (bg.kind === "custom" && bg.customUrl) vars["--bg-image"] = `url("${bg.customUrl.replace(/"/g, "")}")`;
  return vars as CSSProperties;
}
