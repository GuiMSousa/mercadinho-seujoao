const NS = window.MktControlDesignSystem_295891;
const formatBRL = (v) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl = (v) => 'R$ ' + formatBRL(v);
const centsToBRL = (d) => parseInt(d || '0', 10) / 100;
const r2 = (v) => Math.round(v * 100) / 100;
const daysTo = (iso) => Math.round((new Date(iso + 'T12:00:00') - new Date(window.MKT_DATA.today + 'T12:00:00')) / 86400000);
const fmtDate = (iso) => iso.split('-').reverse().join('/');
const stockOf = (p) => p.lots.reduce((s, l) => s + l.qty, 0);
function expiryBadge(iso) {
  const d = daysTo(iso);
  if (d < 0) return { tone: 'danger', label: 'Vencido' };
  if (d === 0) return { tone: 'danger', label: 'Vence hoje' };
  if (d <= 7) return { tone: 'warning', label: 'Vence em ' + d + (d === 1 ? ' dia' : ' dias') };
  return { tone: 'success', label: 'No prazo' };
}
function useWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return w;
}
Object.assign(window, { NS, formatBRL, centsToBRL, brl, r2, daysTo, fmtDate, stockOf, expiryBadge, useWidth });
