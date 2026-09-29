const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ size = 18, className, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} {...rest}>
      {children}
    </svg>
  );
}

export function IconDashboard(props) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="5.5" rx="1.2" />
      <rect x="13.5" y="12.5" width="7" height="8" rx="1.2" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.2" />
    </Svg>
  );
}

export function IconMap(props) {
  return (
    <Svg {...props}>
      <path d="M9 4.5 3.8 6.2v13l5.2-1.7 6 1.7 5.2-1.7v-13l-5.2 1.7-6-1.7Z" />
      <path d="M9 4.5v13" />
      <path d="M15 6.2v13" />
    </Svg>
  );
}

export function IconLayers(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 3.5 8 12 12.5 20.5 8 12 3.5Z" />
      <path d="m3.5 12 8.5 4.5L20.5 12" />
      <path d="m3.5 16 8.5 4.5L20.5 16" />
    </Svg>
  );
}

export function IconUsers(props) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19.5c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.8 14.7c2.2.2 3.9 1.8 4.3 4.3" />
    </Svg>
  );
}

export function IconChat(props) {
  return (
    <Svg {...props}>
      <path d="M4 5.5h16v11H9.5L5 20V16.5H4v-11Z" />
      <path d="M8 9.5h8" />
      <path d="M8 12.5h5" />
    </Svg>
  );
}

export function IconClipboard(props) {
  return (
    <Svg {...props}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
      <rect x="9" y="3" width="6" height="3" rx="1" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14.5h7" />
      <path d="M8.5 18h4.5" />
    </Svg>
  );
}

export function IconUser(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c.8-4 3.4-6.2 7-6.2s6.2 2.2 7 6.2" />
    </Svg>
  );
}

export function IconLogout(props) {
  return (
    <Svg {...props}>
      <path d="M9.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h3.5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9.5" />
    </Svg>
  );
}

export function IconMenu(props) {
  return (
    <Svg {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </Svg>
  );
}

export function IconSun(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.5 12H2M22 12h-2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
    </Svg>
  );
}

export function IconMoon(props) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z" />
    </Svg>
  );
}

export function IconHardHat(props) {
  return (
    <Svg {...props}>
      <path d="M4 16.5c0-4.6 3.6-8.3 8-8.3s8 3.7 8 8.3" />
      <path d="M2.5 16.5h19" />
      <path d="M12 8.2V5" />
      <path d="M9 8.6V6.3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.3" />
    </Svg>
  );
}

export function IconBuilding(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="3.5" width="10" height="17" rx="0.8" />
      <path d="M15 9.5h4v11h-4" />
      <path d="M8 7h1.2M11.8 7H13M8 10.3h1.2M11.8 10.3H13M8 13.6h1.2M11.8 13.6H13" />
    </Svg>
  );
}

export function IconSearch(props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.3-4.3" />
    </Svg>
  );
}

export function IconPlus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function IconArrowRight(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconChevronUp(props) {
  return (
    <Svg {...props}>
      <path d="m6 15 6-6 6 6" />
    </Svg>
  );
}

export function IconChevronDown(props) {
  return (
    <Svg {...props}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function IconClose(props) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function IconPencil(props) {
  return (
    <Svg {...props}>
      <path d="M4 20l.9-3.9L15.6 5.4a1.5 1.5 0 0 1 2.1 0l1 1a1.5 1.5 0 0 1 0 2.1L8 19.1 4 20Z" />
      <path d="M14 7l3 3" />
    </Svg>
  );
}

export function IconPaperclip(props) {
  return (
    <Svg {...props}>
      <path d="M16.5 7.5 8.9 15.1a3 3 0 0 0 4.24 4.24l7.6-7.6a5 5 0 1 0-7.07-7.07L6.2 12.15" />
    </Svg>
  );
}

export function IconSend(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 12 19.5 4.5 13 19.5l-2.2-6.3L4.5 12Z" />
      <path d="M10.8 13.2 19.5 4.5" />
    </Svg>
  );
}

export function IconInfo(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconCompass(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.8 9.2-1.9 4.6-4.6 1.9 1.9-4.6 4.6-1.9Z" />
    </Svg>
  );
}

export function IconGauge(props) {
  return (
    <Svg {...props}>
      <path d="M4 15.5a8 8 0 1 1 16 0" />
      <path d="M12 15.5 15 10" />
      <path d="M12 15.5h.01" />
    </Svg>
  );
}

export function IconTarget(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconFlask(props) {
  return (
    <Svg {...props}>
      <path d="M9.5 3.5h5" />
      <path d="M10.5 3.5v6l-5 9.2a1.5 1.5 0 0 0 1.3 2.3h10.4a1.5 1.5 0 0 0 1.3-2.3l-5-9.2v-6" />
      <path d="M8.2 15.5h7.6" />
    </Svg>
  );
}

export function IconAlertTriangle(props) {
  return (
    <Svg {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10.5v3.5" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconActivity(props) {
  return (
    <Svg {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </Svg>
  );
}

export function IconCheckCircle(props) {
  return (
    <Svg {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </Svg>
  );
}

export function IconRadio(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </Svg>
  );
}