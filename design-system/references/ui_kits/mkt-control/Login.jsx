function Login({ onLogin, theme, setTheme }) {
  const { Button, Input, Card } = NS;
  const users = window.MKT_DATA.users;
  const [email, setEmail] = React.useState(users[0].email);
  const [err, setErr] = React.useState('');
  const submit = (e) => { e.preventDefault(); const u = users.find(x => x.email === email.trim()); if (!u) { setErr('E-mail ou senha incorretos.'); return; } onLogin(u); };
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}><ThemeToggle theme={theme} setTheme={setTheme} /></div>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text-strong)' }}>Mkt Control</div>
          <div style={{ color: 'var(--text-sub)' }}>{window.MKT_DATA.store}</div>
        </div>
        <Card padding="24px" bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-h3)', fontWeight: 500, color: 'var(--text-strong)' }}>Entrar</h1>
          <Input label="E-mail" type="email" size="lg" value={email} onChange={e => { setEmail(e.target.value); setErr(''); }} error={err} autoComplete="username" />
          <Input label="Senha" type="password" size="lg" defaultValue="••••••••" autoComplete="current-password" />
          <Button type="submit" size="lg" fullWidth>Entrar</Button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-sub)' }}>
            Demonstração:
            {users.map(u => <a key={u.id} href="#" onClick={e => { e.preventDefault(); setEmail(u.email); }}>{u.role === 'ADMIN' ? 'Proprietária' : 'Operador'}</a>)}
          </div>
        </Card>
      </form>
    </main>
  );
}
window.Login = Login;
