type LinkItem = { label: string; href: string };

const LINKS: LinkItem[] = [
  { label: "Reddit", href: "https://www.reddit.com/r/BloodyRubynts" },
  { label: "TikTok", href: "https://www.tiktok.com/@bloodyr666" },
  { label: "Discord", href: "https://discord.gg/PASTE_YOUR_INVITE" },
  { label: "Website", href: "https://bloodyruby.com" },
];

export function TopLeftLinks() {
  return (
    <div className="fixed left-3 top-28 z-[9999] flex flex-col gap-2">

      {LINKS.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur hover:bg-black/75"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
