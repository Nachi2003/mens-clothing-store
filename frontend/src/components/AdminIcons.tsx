import React from "react";

type IconProps = {
  name: string;
  size?: number;
  className?: string;
};

export default function Icon({
  name,
  size = 20,
  className = "",
}: IconProps) {
  const icons: Record<string, string> = {
    plus: "+",
    edit: "✎",
    trash: "🗑",
    search: "⌕",
    eye: "◉",
    close: "×",
    check: "✓",
    image: "▧",
    upload: "↑",
    filter: "☰",
    package: "□",
    warning: "⚠",
    refresh: "↻",
    chevronDown: "⌄",
    chevronUp: "⌃",
    chevronRight: "›",
    arrowLeft: "←",
    layers: "▤",
    tag: "◇",
    home: "⌂",
    categories: "▦",
    orders: "▣",
    sales: "$",
    reports: "▥",
    staff: "♙",
    logout: "↪",
    menu: "☰",
    external: "↗",
    imagePlus: "⊕",
    imageOff: "⊘",
    cart: "🛒",
    dollar: "$",
    calendar: "▦",
  };

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {icons[name] ?? "•"}
    </span>
  );
}