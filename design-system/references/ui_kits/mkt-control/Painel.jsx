function WeekChart({ data, hidden }) {
  const max = Math.max(...data.map(d => d.rev));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 16, fontSize: 'var(--text-caption)', color: 'var(--text-sub)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-primary)' }} />Faturamento</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-secondary-legend)' }} />CMV</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + data.length + ',minmax(0,1fr))', gap: 12, height: 200, alignItems: 'end' }}>
        {data.map((d, i) => (
          <div key={d.d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }} title={hidden ? d.d : d.d + ': ' + brl(d.rev) + ' / CMV ' + brl(d.cmv)}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
              <div style={{ width: '38%', maxWidth: 18, height: (d.rev / max * 100) + '%', background: i === data.length - 1 ? 'var(--chart-primary)' : 'var(--chart-primary-muted)', borderRadius: '6px 6px 2px 2px' }} />
              <div style={{ width: '38%', maxWidth: 18, height: (d.cmv / max * 100) + '%', background: 'var(--chart-secondary)', borderRadius: '6px 6px 2px 2px' }} />
            </div>
            <span style={{ fontSize: 'var(--text-caption)', color: i === data.length - 1 ? 'var(--text-strong)' : 'var(--text-soft)', fontWeight: i === data.length - 1 ? 500 : 400 }}>{d.d}</span>
          </div>))}
      </div>
    </div>);
}
function Painel({ user, products, sales, hidden, setPage }) {
  const { StatCard, Card, Tabs, Badge, Button, Money, IconButton } = NS;
  const [period, setPeriod] = React.useState('7d');
  const week = window.MKT_DATA.week;
  const todayRev = r2(week[week.length - 1].rev + sales.reduce((s, v) => s + v.total, 0));
  const todayCmv = r2(week[week.length - 1].cmv + sales.reduce((s, v) => s + v.cmv, 0));
  const rev = period === 'hoje' ? todayRev : r2(week.slice(0, -1).reduce((s, d) => s + d.rev, 0) + todayRev);
  const cmv = period === 'hoje' ? todayCmv : r2(week.slice(0, -1).reduce((s, d) => s + d.cmv, 0) + todayCmv);
  const n = period === 'hoje' ? 41 + sales.length : 312 + sales.length;
  const mg = r2(rev - cmv);
  const lots = products.flatMap(p => p.lots.map(l => ({ ...l, name: p.name }))).filter(l => l.qty > 0 && daysTo(l.exp) <= 7).sort((a, b) => a.exp.localeCompare(b.exp));
  const repo = products.filter(p => stockOf(p) < p.min);
  const h = new Date().getHours(); const hi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const row = (k, left, right) => <li key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>{left}{right}</li>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-sub)' }}>{new Date(window.MKT_DATA.today + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-h1)', lineHeight: 'var(--lh-h1)', fontWeight: 500, letterSpacing: 'var(--tracking-tight)', color: 'var(--text-strong)' }}>{hi}, {user.name.split(' ')[0]}</h2>
        </div>
        <Tabs items={[{ value: 'hoje', label: 'Hoje' }, { value: '7d', label: '7 dias' }]} value={period} onChange={setPeriod} ariaLabel="Período" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 'var(--gutter)' }}>
        <StatCard label="Faturamento" icon="money-receive-01" value={rev} hidden={hidden} delta={period === 'hoje' ? 14.7 : 6.3} deltaLabel={period === 'hoje' ? 'vs. ontem' : 'vs. semana anterior'} />
        <StatCard label="CMV" icon="package" value={cmv} hidden={hidden} footer="custo histórico de cada venda" />
        <StatCard label="Margem bruta" icon="percent" value={mg} hidden={hidden} footer={<span style={{ color: 'var(--success-fg)', fontWeight: 500 }}>{(mg / rev * 100).toFixed(1).replace('.', ',')}% do faturamento</span>} />
        <StatCard label="Ticket médio" icon="invoice-03" value={r2(rev / n)} hidden={hidden} footer={n + ' vendas'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 'var(--gutter)' }}>
        <Card title="Faturamento x CMV" subtitle="Últimos 7 dias" style={{ gridColumn: 'span 2' }} actions={<IconButton icon="more-horizontal" label="Opções" size="sm" />}>
          <WeekChart data={week} hidden={hidden} />
        </Card>
        <Card title="Lotes a vencer" subtitle="Próximos 7 dias" actions={<Button variant="secondary" size="sm" onClick={() => setPage('estoque')}>Ver lotes</Button>}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {lots.map(l => { const b = expiryBadge(l.exp); return row(l.code, <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={{ fontWeight: 500, color: 'var(--text-strong)' }}>{l.name}</span><span style={{ fontSize: 12, color: 'var(--text-soft)' }}>Lote {l.code} · {l.qty} un</span></span>, <Badge size="sm" tone={b.tone} dot>{b.label}</Badge>); })}
          </ul>
        </Card>
        <Card title="Reposição" subtitle={repo.length + ' produtos abaixo do mínimo'} actions={<Button variant="secondary" size="sm" onClick={() => setPage('estoque')}>Ver lista</Button>}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {repo.map(p => row(p.id, <span style={{ fontWeight: 500, color: 'var(--text-strong)' }}>{p.name}</span>, <span style={{ fontSize: 13, color: 'var(--text-sub)', fontVariantNumeric: 'tabular-nums' }}><strong style={{ color: 'var(--warning-fg)', fontWeight: 600 }}>{stockOf(p)}</strong> / {p.min} {p.unit}</span>))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
window.Painel = Painel;
