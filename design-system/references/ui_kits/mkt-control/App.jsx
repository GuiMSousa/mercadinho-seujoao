function App() {
  const { Toast } = NS;
  const D = window.MKT_DATA;
  const [user, setUser] = React.useState(() => { try { return JSON.parse(localStorage.getItem('mkt_user')) || null; } catch (_) { return null; } });
  const [page, setPage] = React.useState('vendas');
  const [products, setProducts] = React.useState(D.products);
  const [caixa, setCaixa] = React.useState({ open: true, troco: 150, openedAt: '07:58', movs: [
    { id: 1, time: '07:58', type: 'abertura', value: 150, desc: 'Troco inicial' },
    { id: 2, time: '09:14', type: 'venda', pay: 'dinheiro', value: 42.37, desc: 'Venda #1042 · Dinheiro' },
    { id: 3, time: '11:30', type: 'sangria', value: 200, desc: 'Depósito no banco' },
    { id: 4, time: '12:05', type: 'suprimento', value: 50, desc: 'Reforço de troco (moedas)' },
  ] });
  const [sales, setSales] = React.useState([]);
  const [hidden, setHidden] = React.useState(false);
  const [theme, setTheme] = React.useState(() => localStorage.getItem('mkt_theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('mkt_theme', theme); }, [theme]);
  const [toastData, setToastData] = React.useState(null);
  const tRef = React.useRef();
  const toast = (t) => { setToastData(t); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToastData(null), 3200); };
  const login = (u) => { setUser(u); localStorage.setItem('mkt_user', JSON.stringify(u)); setPage(u.role === 'ADMIN' ? 'painel' : 'vendas'); };
  const logout = () => { setUser(null); localStorage.removeItem('mkt_user'); };
  const onSale = (cart, total, pay) => {
    let cmv = 0;
    setProducts(ps => ps.map(p => { const line = cart.find(l => l.id === p.id); if (!line) return p; let need = line.qty; cmv += r2(p.cost * line.qty);
      const lots = [...p.lots].sort((a, b) => a.exp.localeCompare(b.exp)).map(l => { const take = Math.min(l.qty, need); need -= take; return { ...l, qty: l.qty - take }; }); return { ...p, lots }; }));
    const id = 1043 + sales.length;
    setSales(s => [...s, { id, total, cmv: r2(cart.reduce((s2, l) => s2 + r2((products.find(p => p.id === l.id).cost) * l.qty), 0)), pay }]);
    setCaixa(c => ({ ...c, movs: [...c.movs, { id: Date.now(), time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), type: 'venda', pay, value: total, desc: 'Venda #' + id + ' · ' + ({ dinheiro: 'Dinheiro', pix: 'Pix', cartao: 'Cartão' })[pay] }] }));
  };
  if (!user) return <Login onLogin={login} theme={theme} setTheme={setTheme} />;
  const alerts = products.filter(p => stockOf(p) < p.min).length + products.flatMap(p => p.lots).filter(l => l.qty > 0 && daysTo(l.exp) < 0).length;
  const pg = user.role !== 'ADMIN' && page === 'painel' ? 'vendas' : page;
  return (
    <>
      <Shell user={user} page={pg} setPage={setPage} caixaOpen={caixa.open} hidden={hidden} setHidden={setHidden} onLogout={logout} alerts={alerts} theme={theme} setTheme={setTheme}>
        {pg === 'painel' && <Painel user={user} products={products} sales={sales} hidden={hidden} setPage={setPage} />}
        {pg === 'vendas' && <Vendas caixaOpen={caixa.open} products={products} onSale={onSale} goCaixa={() => setPage('caixa')} toast={toast} />}
        {pg === 'caixa' && <Caixa user={user} caixa={caixa} setCaixa={setCaixa} toast={toast} />}
        {pg === 'estoque' && <Estoque user={user} products={products} setProducts={setProducts} toast={toast} />}
      </Shell>
      {toastData && <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 200 }}><Toast {...toastData} onClose={() => setToastData(null)} /></div>}
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
