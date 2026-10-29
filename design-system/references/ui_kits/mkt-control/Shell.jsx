function navFor(role, alerts) {
  const main = [
    ...(role === 'ADMIN' ? [{ value: 'painel', label: 'Painel', icon: 'dashboard-square-01' }] : []),
    { value: 'vendas', label: 'Vendas', icon: 'shopping-cart-01' },
    { value: 'caixa', label: 'Caixa', icon: 'cash-01' },
  ];
  const est = [{ value: 'estoque', label: role === 'ADMIN' ? 'Produtos e lotes' : 'Consultar produtos', icon: 'package', badge: role === 'ADMIN' && alerts ? alerts : undefined, badgeTone: 'danger' }];
  return [{ items: main }, { title: 'Estoque', items: est }];
}
function ThemeToggle({ theme, setTheme }) {
  const { IconButton, Tooltip } = NS;
  const dark = theme === 'dark';
  const label = dark ? 'Modo claro' : 'Modo escuro';
  return <Tooltip content={label} placement="bottom"><IconButton icon={dark ? 'sun-03' : 'moon-02'} label={label} variant="ghost" onClick={() => setTheme(dark ? 'light' : 'dark')} /></Tooltip>;
}
window.ThemeToggle = ThemeToggle;
function Shell({ user, page, setPage, caixaOpen, hidden, setHidden, onLogout, alerts, theme, setTheme, children }) {
  const { SidebarNav, BottomNav, Badge, IconButton, Icon, Tooltip } = NS;
  const w = useWidth(); const mobile = w < 900;
  const sections = navFor(user.role, alerts);
  const titles = { painel: 'Painel', vendas: 'Vendas', caixa: 'Caixa', estoque: user.role === 'ADMIN' ? 'Produtos e lotes' : 'Consultar produtos' };
  const status = <Badge tone={caixaOpen ? 'success' : 'neutral'} dot>{caixaOpen ? 'Caixa aberto' : 'Caixa fechado'}</Badge>;
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
      <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--surface-inverse)', color: 'var(--text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="store-01" size={18} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-soft)' }}>Mkt Control</span>
        <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{window.MKT_DATA.store}</span>
      </span>
    </div>);
  const footer = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 'var(--radius-lg)', background: 'var(--surface-sunken)' }}>
      {status}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--selected-bg)', color: 'var(--selected-fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>{user.name.split(' ').map(s => s[0]).join('')}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500, color: 'var(--text-strong)' }}>{user.name}</span>
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-sub)' }}>{user.role === 'ADMIN' ? 'Administrador' : 'Operador de caixa'}</span>
        </span>
        <IconButton icon="logout-01" label="Sair" variant="ghost" size="sm" onClick={onLogout} />
      </div>
    </div>);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {!mobile && <SidebarNav sections={sections} value={page} onSelect={setPage} header={header} footer={footer} />}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 'var(--topbar-h)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 var(--page-pad)', borderBottom: '1px solid var(--border-default)', background: 'var(--surface-card)' }}>
          <h1 style={{ margin: 0, flex: 1, fontSize: 'var(--text-h3)', fontWeight: 500, color: 'var(--text-strong)', letterSpacing: '-0.01em' }}>{titles[page]}</h1>
          {mobile && status}
          {user.role === 'ADMIN' && <Tooltip content={hidden ? 'Mostrar valores' : 'Ocultar valores'} placement="bottom"><IconButton icon={hidden ? 'view' : 'view-off'} label={hidden ? 'Mostrar valores' : 'Ocultar valores'} variant="ghost" onClick={() => setHidden(!hidden)} /></Tooltip>}
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <IconButton icon="notification-01" label="Notificações" variant="ghost" />
          {mobile && <IconButton icon="logout-01" label="Sair" variant="ghost" onClick={onLogout} />}
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 'var(--page-pad)', paddingBottom: mobile ? 96 : 'var(--page-pad)' }}>{children}</main>
      </div>
      {mobile && <div style={{ position: 'fixed', left: 16, right: 16, bottom: 16, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
        <BottomNav value={page} onSelect={setPage} items={sections.flatMap(s => s.items).map(i => ({ value: i.value, label: i.value === 'estoque' ? 'Estoque' : i.label, icon: i.icon }))} />
      </div>}
    </div>
  );
}
window.Shell = Shell;
