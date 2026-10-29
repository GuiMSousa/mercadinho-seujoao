function AmountDialog({ open, kind, onClose, onConfirm, requireReason }) {
  const { Dialog, Button, Keypad, Money, Input } = NS;
  const [d, setD] = React.useState(''); const [motivo, setMotivo] = React.useState(''); const [err, setErr] = React.useState('');
  React.useEffect(() => { if (open) { setD(''); setMotivo(''); setErr(''); } }, [open]);
  const meta = { sangria: ['Registrar sangria', 'Retirada de dinheiro da gaveta.'], suprimento: ['Registrar suprimento', 'Entrada de dinheiro na gaveta.'], abrir: ['Abrir caixa', 'Informe o troco disponível na gaveta.'], fechar: ['Fechamento cego', 'Conte o dinheiro da gaveta e informe o total. O valor esperado não é exibido.'] }[kind] || ['', ''];
  const ok = () => { if (requireReason && !motivo.trim()) { setErr('Informe o motivo.'); return; } onConfirm(centsToBRL(d), motivo.trim()); };
  return (
    <Dialog open={open} onClose={onClose} title={meta[0]} description={meta[1]} width={440}
      footer={<><Button variant="secondary" size="counter" onClick={onClose}>Cancelar</Button><Button variant="brand" size="counter" onClick={ok} disabled={kind !== 'abrir' && !d}>Confirmar</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)', textAlign: 'right' }}><Money value={centsToBRL(d)} size="counter" mutedCents={false} /></div>
        <Keypad value={d} onChange={setD} />
        {requireReason && <Input label="Motivo" size="counter" value={motivo} onChange={e => { setMotivo(e.target.value); setErr(''); }} error={err} placeholder={kind === 'sangria' ? 'Ex.: depósito no banco' : 'Ex.: reforço de troco'} />}
      </div>
    </Dialog>
  );
}
function Caixa({ user, caixa, setCaixa, toast }) {
  const { Button, Card, StatCard, Table, Badge, Money } = NS;
  const [dlg, setDlg] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const admin = user.role === 'ADMIN';
  const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const movs = caixa.movs;
  const sum = (t) => r2(movs.filter(m => m.type === t).reduce((s, m) => s + m.value, 0));
  const vendasDin = r2(movs.filter(m => m.type === 'venda' && m.pay === 'dinheiro').reduce((s, m) => s + m.value, 0));
  const esperado = r2(caixa.troco + vendasDin + sum('suprimento') - sum('sangria'));
  const confirm = (v, motivo) => {
    if (dlg === 'abrir') { setCaixa({ open: true, troco: v, openedAt: now(), movs: [{ id: Date.now(), time: now(), type: 'abertura', value: v, desc: 'Troco inicial' }] }); toast({ tone: 'success', title: 'Caixa aberto', message: 'Troco inicial ' + brl(v) }); setResult(null); }
    else if (dlg === 'fechar') { const quebra = r2(v - esperado); setResult({ contado: v, esperado, quebra }); setCaixa({ open: false, troco: 0, movs: [] }); toast({ tone: quebra === 0 ? 'success' : 'warning', title: 'Caixa fechado', message: admin ? (quebra === 0 ? 'Sem quebra.' : 'Quebra de ' + brl(quebra)) : 'Contagem registrada.' }); }
    else { setCaixa({ ...caixa, movs: [...movs, { id: Date.now(), time: now(), type: dlg, value: v, desc: motivo }] }); toast({ tone: 'success', title: dlg === 'sangria' ? 'Sangria registrada' : 'Suprimento registrado', message: brl(v) + ' · ' + motivo }); }
    setDlg(null);
  };
  const typeBadge = { abertura: ['info', 'Abertura'], venda: ['success', 'Venda'], sangria: ['danger', 'Sangria'], suprimento: ['warning', 'Suprimento'] };
  const dialog = <AmountDialog open={!!dlg} kind={dlg} onClose={() => setDlg(null)} onConfirm={confirm} requireReason={dlg === 'sangria' || dlg === 'suprimento'} />;
  if (!caixa.open) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)', maxWidth: 720 }}>
      {result && <Card title="Último fechamento" subtitle="Hoje">
        {admin ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }}>
          <div><div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Esperado</div><Money value={result.esperado} size="lg" /></div>
          <div><div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Contado</div><Money value={result.contado} size="lg" /></div>
          <div><div style={{ color: 'var(--text-sub)', fontSize: 13 }}>Quebra</div><Money value={result.quebra} size="lg" signed tone={result.quebra < 0 ? 'out' : result.quebra > 0 ? 'in' : undefined} /></div>
        </div> : <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 16 }}>Contagem de {brl(result.contado)} registrada. A conferência é feita pelo administrador.</p>}
      </Card>}
      <Card bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
        <Badge tone="neutral" dot>Caixa fechado</Badge>
        <h2 style={{ margin: 0, fontSize: 'var(--text-h2)', fontWeight: 500, color: 'var(--text-strong)' }}>Abrir caixa</h2>
        <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 16 }}>Só um caixa pode ficar aberto por vez. Sem caixa aberto, nenhuma venda é registrada.</p>
        <Button size="counter" variant="brand" leadingIcon="cash-01" onClick={() => setDlg('abrir')}>Abrir caixa</Button>
      </Card>
      {dialog}
    </div>);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Badge tone="success" dot>Aberto às {caixa.openedAt}</Badge>
        <span style={{ color: 'var(--text-sub)' }}>por {user.name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--gutter)' }}>
        <StatCard label="Troco inicial" icon="coins-01" value={caixa.troco} />
        <StatCard label="Sangrias" icon="money-send-01" value={sum('sangria')} />
        <StatCard label="Suprimentos" icon="money-receive-01" value={sum('suprimento')} />
        {admin && <StatCard label="Esperado na gaveta" icon="wallet-01" value={esperado} />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
        <Button size="counter" variant="secondary" leadingIcon="money-send-01" onClick={() => setDlg('sangria')}>Sangria</Button>
        <Button size="counter" variant="secondary" leadingIcon="money-receive-01" onClick={() => setDlg('suprimento')}>Suprimento</Button>
        <Button size="counter" variant="primary" leadingIcon="lock-key" onClick={() => setDlg('fechar')}>Fechar caixa</Button>
      </div>
      <Card title="Movimentos" padding="8px 12px 4px">
        <Table rowKey="id" columns={[
          { key: 'time', label: 'Hora', width: 72 },
          { key: 'type', label: 'Tipo', render: r => <Badge size="sm" tone={typeBadge[r.type][0]}>{typeBadge[r.type][1]}</Badge> },
          { key: 'desc', label: 'Descrição', wrap: true },
          { key: 'value', label: 'Valor', align: 'right', render: r => <Money value={r.type === 'sangria' ? -r.value : r.value} size="sm" tone={r.type === 'sangria' ? 'out' : undefined} /> },
        ]} rows={[...movs].reverse()} />
      </Card>
      {dialog}
    </div>
  );
}
window.Caixa = Caixa;
