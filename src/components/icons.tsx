import type { ReactElement, SVGProps } from 'react';

type IconName =
  | 'location'
  | 'theme'
  | 'layout'
  | 'style'
  | 'layers'
  | 'markers'
  | 'routes'
  | 'settings'
  | 'download'
  | 'search'
  | 'close'
  | 'target'
  | 'upload'
  | 'trash'
  | 'plus'
  | 'lock'
  | 'rotate'
  | 'check'
  | 'chevron';

const PATHS: Record<IconName, ReactElement> = {
  location: (
    <>
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  theme: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1 .8-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-5-4-8-9-8z" />
      <circle cx="7.5" cy="10.5" r="1" /><circle cx="12" cy="7.5" r="1" /><circle cx="16.5" cy="10.5" r="1" />
    </>
  ),
  layout: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M4 15h16" />
    </>
  ),
  style: (
    <>
      <path d="M5 5h14" /><path d="M12 5v14" /><path d="M9 19h6" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" />
    </>
  ),
  markers: (
    <>
      <path d="M12 21s-6-4.9-6-10a6 6 0 1 1 12 0c0 5.1-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </>
  ),
  routes: (
    <>
      <circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" />
      <path d="M8 16.5c6-1 8-4 8.5-8.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" /><path d="M7 11l5 5 5-5" /><path d="M4 20h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  target: (
    <>
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  upload: (
    <>
      <path d="M12 17V5" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 1 1 2.3 5.6" /><path d="M4 20v-4h4" />
    </>
  ),
  check: <path d="M5 12l5 5 9-11" />,
  chevron: <path d="M9 6l6 6-6 6" />,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
