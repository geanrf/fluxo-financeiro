type IconName =
  | 'arrow-down'
  | 'arrow-up'
  | 'chart'
  | 'edit'
  | 'logout'
  | 'plus'
  | 'trash'
  | 'wallet'
  | 'x'

const paths: Record<IconName, string> = {
  'arrow-down': 'M12 5v14m0 0 6-6m-6 6-6-6',
  'arrow-up': 'M12 19V5m0 0-6 6m6-6 6 6',
  chart: 'M4 19V9m6 10V5m6 14v-7m4 7H2',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z',
  logout: 'M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18m-2 0-1 14H6L5 6m3 0V4h8v2m-6 4v6m4-6v6',
  wallet: 'M4 6.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2Zm0 0h14a2 2 0 0 1 2 2V12h-5a2 2 0 0 0 0 4h5m-4-2h.01',
  x: 'M6 6l12 12M18 6 6 18',
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={paths[name]} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
