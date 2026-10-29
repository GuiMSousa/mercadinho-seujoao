function EntradaDialog({ open, onClose, products, onSave }) {
  const { Dialog, Button, Input, Select } = NS;
  const [pid, setPid] = React.useState(products[0].id);
  const [f, setF] = React.useState({ lote: '', exp: '', qty: '', cost: '' });
  React.useEffect(() => { if (open) setF({ lote: '', exp: '', qty: '', cost: '' }); }, [open]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const valid = f.lote && f.exp && Number(f.qty) > 0;
  return (
    <Dialog open={open} onClose={onClose} title="Entrada de mercadoria" description="Cada entrada cria um lote com validade própria." width={520}
      footer={<><Button variant="secondary" size="counter" onClick={onClose}>Cancelar</Button><Button variant="brand" size="counter" disabled={!valid} onClick={() => onSave(pid, { code: f.lote, exp: f.exp, qty: Number(f.qty) }, Number(String(f.cost).replace(',', '.')) || null)}>Registrar entrada</Button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <Select label="Produto" size="counter" value={pid} onChange={e => setPid(e.target.value)} options={products.map(p => ({ value: p.id, label: p.name }))} style={{ gridColumn: '1 / -1' }} />
        <Input label="Lote" size="counter" value={f.lote} onChange={set('lote')} placeholder="L2501" />
        <Input label="Validade" size="counter" type="date" value={f.exp} onChange={set('exp')} />
        <Input label="Quantidade" size="counter" numeric inputMode="numeric" value={f.qty} onChange={set('qty')} />
        <Input label="Custo unitário" size="counter" prefix="R$" numeric inputMode="decimal" value={f.cost} onChange={set('cost')} />
      </div>
    </Dialog>);
}
function Estoque({ user, products, setProducts, toast }) {
  const { Tabs, Card, Table, Badge, Money, Input, Button, Tag } = NS;
  const admin = user.role === 'ADMIN';
  const [tab, setTab] = React.useState('produtos');
  const [q, setQ] = React.useState('');
  const [entrada, setEntrada] = React.useState(false);
  const list = products.filter(p => (p.name + p.sku + p.cat).toLowerCase().includes(q.toLowerCase()));
  const repo = products.filter(p => stockOf(p) < p.min);
  const lots = products.flatMap(p => p.lots.map(l => ({ ...l, pid: p.id, name: p.name, key: p.id + l.code }))).filter(l => l.qty > 0).sort((a, b) => a.exp.localeCompare(b.exp));
  const stockBadge = p => { const s = stockOf(p); return s === 0 ? <Badge size="sm" tone="danger" dot>Sem estoque</Badge> : s < p.min ? <Badge size="sm" tone="warning" dot>Abaixo do mínimo</Badge> : <Badge size="sm" tone="success" dot>Ok</Badge>; };
  const cols = [
    { key: 'name', label: 'Produto', render: p => <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 500 }}>{p.name}</span><span style={{ color: 'var(--text-soft)', fontSize: 12 }}>{p.sku}</span></span> },
    { key: 'cat', label: 'Categoria', render: p => <Tag>{p.cat}</Tag> },
    { key: 'stock', label: 'Estoque', align: 'right', render: p => stockOf(p) + ' ' + p.unit },
    ...(admin ? [{ key: 'min', label: 'Mínimo', align: 'right', render: p => p.min + ' ' + p.unit }, { key: 'cost', label: 'Custo', align: 'right', render: p => <Money value={p.cost} size="sm" /> }] : []),
    { key: 'price', label: 'Preço', align: 'right', render: p => <Money value={p.price} size="sm" /> },
    ...(admin ? [{ key: 'mg', label: 'Margem', align: 'right', render: p => <span style={{ color: 'var(--success-fg)', fontWeight: 500 }}>{(((p.price - p.cost) / p.price) * 100).toFixed(1).replace('.', ',')}%</span> }] : []),
    { key: 'st', label: 'Situação', render: stockBadge },
  ];
  const tabs = [{ value: 'produtos', label: 'Produtos' }, ...(admin ? [{ value: 'lotes', label: 'Lotes (PVPS)' }, { value: 'reposicao', label: 'Reposição', count: repo.length }] : [])];
  const save = (pid, lot, cost) => { setProducts(ps => ps.map(p => p.id === pid ? { ...p, cost: cost || p.cost, lots: [...p.lots, lot] } : p)); setEntrada(false); toast({ tone: 'success', title: 'Entrada registrada', message: 'Lote ' + lot.code + ' · ' + lot.qty + ' un' }); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {tabs.length > 1 && <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Visão do estoque" />}
        <Input leadingIcon="search-01" placeholder="Buscar por nome, código ou categoria" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="Buscar" />
        {admin && <Button variant="secondary" leadingIcon="file-import">Importar produtos</Button>}
        {admin && <Button variant="brand" size="counter" leadingIcon="package-receive" onClick={() => setEntrada(true)}>Entrada</Button>}
      </div>
      {tab === 'produtos' && <Card padding="8px 12px 4px"><Table rowKey="id" columns={cols} rows={list} empty="Nenhum produto encontrado." /></Card>}
      {tab === 'lotes' && <Card title="Lotes por validade" subtitle="A baixa nas vendas sempre consome primeiro o lote do topo de cada produto." padding="8px 12px 4px">
        <Table rowKey="key" columns={[
          { key: 'name', label: 'Produto' }, { key: 'code', label: 'Lote' },
          { key: 'exp', label: 'Validade', render: l => fmtDate(l.exp) },
          { key: 'st', label: 'Situação', render: l => { const b = expiryBadge(l.exp); return <Badge size="sm" tone={b.tone} dot>{b.label}</Badge>; } },
          { key: 'qty', label: 'Qtd.', align: 'right' },
        ]} rows={lots.filter(l => l.name.toLowerCase().includes(q.toLowerCase()))} />
      </Card>}
      {tab === 'reposicao' && <Card title="Lista de reposição" subtitle="Gerada a partir do estoque mínimo de cada produto." actions={<Button variant="secondary" size="sm" leadingIcon="printer">Imprimir</Button>} padding="8px 12px 4px">
        <Table rowKey="id" columns={[
          { key: 'name', label: 'Produto' },
          { key: 's', label: 'Estoque', align: 'right', render: p => stockOf(p) + ' ' + p.unit },
          { key: 'min', label: 'Mínimo', align: 'right', render: p => p.min + ' ' + p.unit },
          { key: 'sug', label: 'Comprar', align: 'right', render: p => <strong style={{ fontWeight: 600 }}>{p.min * 2 - stockOf(p)} {p.unit}</strong> },
          { key: 'c', label: 'Custo estimado', align: 'right', render: p => <Money value={r2(p.cost * (p.min * 2 - stockOf(p)))} size="sm" /> },
        ]} rows={repo} empty="Nada abaixo do mínimo." />
      </Card>}
      <EntradaDialog open={entrada} onClose={() => setEntrada(false)} products={products} onSave={save} />
    </div>
  );
}
window.Estoque = Estoque;
