const Svg = ({ children, size = 18, className = '', strokeWidth = 1.9, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);
export const ArrowLeft = (p) => (
  <Svg {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Svg>
);
export const ArrowRight = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Svg>
);
export const Headphones = (p) => (
  <Svg {...p}>
    <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
    <path d="M5 14h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" />
    <path d="M19 14h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" />
  </Svg>
);
export const ShieldCheck = (p) => (
  <Svg {...p}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);
export const Sparkles = (p) => (
  <Svg {...p}>
    <path d="m12 3-1.2 3.6L7 8l3.8 1.4L12 13l1.2-3.6L17 8l-3.8-1.4L12 3Z" />
    <path d="m19 13-.7 2.3L16 16l2.3.7L19 19l.7-2.3L22 16l-2.3-.7L19 13Z" />
    <path d="m5 14-.7 2.3L2 17l2.3.7L5 20l.7-2.3L8 17l-2.3-.7L5 14Z" />
  </Svg>
);
export const Truck = (p) => (
  <Svg {...p}>
    <path d="M3 5h11v11H3z" />
    <path d="M14 8h4l3 3v5h-7z" />
    <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
  </Svg>
);
export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Svg>
);
export const ShoppingCart = (p) => (
  <Svg {...p}>
    <path d="M3 4h2l2 11h10l3-8H6" />
    <circle cx="9" cy="19" r="1.5" />
    <circle cx="18" cy="19" r="1.5" />
  </Svg>
);
export const LogOut = (p) => (
  <Svg {...p}>
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
  </Svg>
);
export const Menu = (p) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);
export const X = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const Sun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);
export const Moon = (p) => (
  <Svg {...p}>
    <path d="M20.8 15.5A8.5 8.5 0 0 1 8.5 3.2 8.5 8.5 0 1 0 20.8 15.5Z" />
  </Svg>
);
export const CheckCircle2 = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 2.5 2.5L16 9" />
  </Svg>
);
export const Info = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);
export const XCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </Svg>
);
