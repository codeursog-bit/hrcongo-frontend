/** SVG/Recharts accepte les variables CSS : changement de thème sans refetch. */
export const chartTheme = {
  series: ['var(--brand)', 'var(--green)', 'var(--mustard)', 'var(--text-secondary)', 'color-mix(in srgb,var(--brand) 45%,var(--surface))', 'var(--text-muted)', 'color-mix(in srgb,var(--green) 45%,var(--surface))', 'var(--surface-2)'],
  text: 'var(--text-secondary)',
  surface: 'var(--surface)',
  track: 'var(--surface-2)',
  tooltip: { backgroundColor:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'var(--shadow-pop)', fontSize:12 },
} as const;
