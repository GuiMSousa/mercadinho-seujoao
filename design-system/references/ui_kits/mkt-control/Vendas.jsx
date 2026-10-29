function CartLine({ line, onQty, onRemove }) {
  const { IconButton, Money } = NS;
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-body-lg)', fontWeight: 500, color: 'var(--text-strong)' }}>{line.name}</div>
        <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-sub)', fontVariantNumeric: 'tabular-nums' }}>{brl(line.price)} / {line.unit}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconButton icon={line.qty === 1 ? 'delete-02' : 'remove-01'} label={line.qty === 1 ? 'Remover item' : 'Diminuir'} size="counter" onClick={() => line.qty === 1 ? onRemove() : onQty(line.qty - 1)} />
        <span style={{ width: 44, textAlign: 'center', fontSize: 'var(--text-counter)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{line.qty}</span>
        <IconButton icon="add-01" label="Aumentar" size="counter" onClick={() => onQty(line.qty + 1)} />
      </div>
      <div style={{ width: 110, textAlign: 'right' }}><Money value={r2(line.price * line.qty)} size="md" /></div>
    </li>
  );
}
function Vendas({ caixaOpen, products, onSale, goCaixa, toast }) {
  const { Input, Button, Card, Tabs, Money, Icon, Keypad } = NS;
  const [q, setQ] = React.useState('');
  const [cart, setCart] = React.useState([]);
  const [pay, setPay] = React.useState('dinheiro');
  const [recv, setRecv] = React.useState('');
  const w = useWidth();
  if (!caixaOpen) return (
    <div style={{ maxWidth: 480, margin: '48px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <span style={{ width: 56, height: 56, borderRadius: 'var(--radius-xl)', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="lock-key" size={28} /></span>
      <h2 style={{ margin: 0, fontSize: 'var(--text-h2)', fontWeight: 500, color: 'var(--text-strong)' }}>Nenhum caixa aberto</h2>
      <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 'var(--text-body-lg)' }}>Abra o caixa com o troco inicial para começar a vender.</p>
      <Button size="counter" variant="brand" leadingIcon="cash-01" onClick={goCaixa}>Abrir caixa</Button>
    </div>);
  const results = q.trim() ? products.filter(p => (p.name + ' ' + p.sku).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : products.slice(0, 6);
  const add = (p) => { setCart(c => { const i = c.findIndex(l => l.id === p.id); if (i >= 0) return c.map((l, j) => j === i ? { ...l, qty: l.qty + 1 } : l); return [...c, { id: p.id, name: p.name, price: p.price, unit: p.unit, qty: 1 }]; }); setQ(''); };
  const total = r2(cart.reduce((s, l) => s + r2(l.price * l.qty), 0));
  const received = centsToBRL(recv);
  const troco = r2(received - total);
  const canFinish = cart.length > 0 && (pay !== 'dinheiro' || received >= total);
  const finish = () => { onSale(cart, total, pay); toast({ tone: 'success', title: 'Venda finalizada', message: pay === 'dinheiro' && troco > 0 ? 'Troco: ' + brl(troco) : 'Total ' + brl(total) }); setCart([]); setRecv(''); setPay('dinheiro'); };
  const stack = w < 1180;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: stack ? 'minmax(0,1fr)' : 'minmax(0,1fr) 400px', gap: 'var(--gutter)', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)', minWidth: 0 }}>
        <Input size="counter" leadingIcon="bar-code-01" placeholder="Código de barras ou nome do produto" value={q} onChange={e => setQ(e.target.value)} autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && results[0]) add(results[0]); }} aria-label="Buscar produto" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
          {results.map(p => (
            <button key={p.id} type="button" onClick={() => add(p)} style={{ minHeight: 76, textAlign: 'left', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--surface-card)', cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'var(--shadow-xs)', touchAction: 'manipulation' }}>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-strong)' }}>{p.name}</span>
              <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-sub)', fontVariantNumeric: 'tabular-nums' }}>{brl(p.price)} · {stockOf(p)} {p.unit} em estoque</span>
            </button>))}
          {results.length === 0 && <div style={{ color: 'var(--text-sub)', padding: 12 }}>Nenhum produto encontrado.</div>}
        </div>
        <Card title="Itens da venda" subtitle={cart.length ? cart.length + (cart.length === 1 ? ' item' : ' itens') : undefined}
          actions={cart.length ? <Button variant="ghost" size="sm" onClick={() => setCart([])}>Limpar</Button> : null}>
          {cart.length === 0 ? <p style={{ margin: 0, padding: '24px 0', textAlign: 'center', color: 'var(--text-sub)', fontSize: 'var(--text-body-lg)' }}>Bipe ou toque em um produto para adicionar.</p> :
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>{cart.map((l, i) => <CartLine key={l.id} line={l} onQty={n => setCart(c => c.map((x, j) => j === i ? { ...x, qty: n } : x))} onRemove={() => setCart(c => c.filter((_, j) => j !== i))} />)}</ul>}
        </Card>
      </div>
      <Card style={{ position: stack ? 'static' : 'sticky', top: 0 }} bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 16, color: 'var(--text-sub)' }}>Total</div>
          <Money value={total} size="counter" mutedCents={false} />
        </div>
        <Tabs size="counter" fullWidth value={pay} onChange={setPay} ariaLabel="Forma de pagamento" items={[{ value: 'dinheiro', label: 'Dinheiro', icon: 'cash-01' }, { value: 'pix', label: 'Pix', icon: 'qr-code' }, { value: 'cartao', label: 'Cartão', icon: 'credit-card' }]} style={{ flexWrap: 'wrap' }} />
        {pay === 'dinheiro' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, color: 'var(--text-sub)' }}>Recebido</span><Money value={received} size="lg" mutedCents={false} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, color: 'var(--text-sub)' }}>Troco</span>
            {received >= total && cart.length ? <Money value={troco} size="lg" tone="margin" mutedCents={false} /> : <span style={{ fontSize: 16, color: 'var(--text-soft)' }}>—</span>}
          </div>
          <Keypad value={recv} onChange={setRecv} />
        </>}
        <Button size="counter" variant="brand" fullWidth leadingIcon="tick-02" disabled={!canFinish} onClick={finish}>Finalizar venda</Button>
      </Card>
    </div>
  );
}
window.Vendas = Vendas;
