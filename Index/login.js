(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.CYBERX_SUPABASE_CONFIG || {};
  const ownerEmail = String(cfg.developerEmail || 'brightonsabo@gmail.com').trim().toLowerCase();
  const params = new URLSearchParams(location.search);
  const requestedNext = params.get('next') || 'home';
  let mode = 'signin';
  let supabase = null;

  const validConfig = () => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(String(cfg.url || '').trim()) &&
    /^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(String(cfg.publishableKey || '').trim());
  function setStatus(message, type = '') {
    $('status').className = 'status' + (type ? ' ' + type : '');
    $('status').textContent = message;
  }
  function busy(value, label) {
    $('submitButton').disabled = value;
    $('submitButton').textContent = value ? label : (mode === 'signin' ? 'Login' : 'Create Account');
    ['googleButton','facebookButton','appleButton'].forEach(id => { const el = $(id); if (el) el.disabled = value; });
  }
  async function getClient() {
    if (!validConfig()) throw new Error('Cloud login is not configured yet. Guest mode is available for a local preview; live user accounts and developer access need a dedicated CyberX Supabase project.');
    if (location.protocol === 'file:') throw new Error('Open CyberX through Index/Start-CyberX-Localhost.bat or an HTTPS website. Browsers restrict cloud authentication on file:// pages.');
    if (!window.CyberXSupabase || !window.CyberXSupabase.validConfig()) throw new Error('CyberX authentication module did not load. Refresh the page or re-extract the complete ZIP.');
    if (!supabase) supabase = window.CyberXSupabase.createClient();
    return supabase;
  }
  async function determineRole(user) {
    if (!user || !user.id || !user.email) throw new Error('Supabase did not return a verified user identity.');
    const client = await getClient();
    const email = user.email.trim().toLowerCase();
    const { data: allow, error } = await client.from('cyberx_developer_allowlist')
      .select('email,access_level,enabled').eq('email', email).eq('enabled', true).maybeSingle();
    if (error) throw new Error('CyberX could not verify the account role. Apply the SQL migrations in the supabase/migrations folder, then try again. ' + error.message);
    const isDeveloper = Boolean(allow && allow.enabled && ['owner', 'developer'].includes(String(allow.access_level || '').toLowerCase()));
    const resolvedRole = isDeveloper ? String(allow.access_level).toLowerCase() : 'user';
    const { error: eventError } = await client.from('cyberx_app_events').insert({
      actor_id: user.id,
      event_name: 'auth.login',
      metadata: { source: 'unified_login', role: resolvedRole, provider: user.app_metadata?.provider || 'email' }
    });
    if (eventError) console.warn('Could not record sign-in event:', eventError.message);
    sessionStorage.removeItem('cyberx_guest_mode');
    localStorage.removeItem('cyberx_guest_mode');
    if (isDeveloper) {
      sessionStorage.setItem('cyberx_role', 'developer');
      location.replace('Developer-Console.html');
      return;
    }
    sessionStorage.setItem('cyberx_role', 'user');
    const target = requestedNext === 'code-studio' ? 'Code-Studio.html' : '../Command-Centre.html';
    location.replace(target);
  }
  ['googleButton','facebookButton','appleButton'].forEach(id => { const el = $(id); if (el) el.disabled = false; });
  $('googleButton').title = 'Continue with Google through CyberX Supabase Auth.';
  $('facebookButton').title = 'Continue with Facebook if the Facebook provider is enabled in Supabase.';
  $('appleButton').title = 'Continue with Apple if the Apple provider is enabled in Supabase.';
  const rememberBox = $('rememberMe');
  if (rememberBox) { rememberBox.checked = sessionStorage.getItem('cyberx.remember-session') !== 'false'; rememberBox.addEventListener('change', () => { sessionStorage.setItem('cyberx.remember-session', rememberBox.checked ? 'true' : 'false'); }); }

  async function verifySession() {
    if (!validConfig() || location.protocol === 'file:') return;
    try {
      const client = await getClient();
      const { data: { session }, error } = await client.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        const { data, error: userError } = await client.auth.getUser();
        if (userError) throw userError;
        await determineRole(data.user);
      }
    } catch (error) {
      setStatus(error.message || 'Could not verify the saved session.', 'error');
    }
  }

  $('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('email').value.trim().toLowerCase();
    const password = $('password').value;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus('Enter a valid email address.', 'error');
    if (!password || password.length < 8) return setStatus('Enter a password with at least 8 characters.', 'error');
    if ($('rememberMe')) sessionStorage.setItem('cyberx.remember-session', $('rememberMe').checked ? 'true' : 'false');
    busy(true, mode === 'signin' ? 'VERIFYING ACCOUNT…' : 'CREATING ACCOUNT…');
    try {
      const client = await getClient();
      const authSettings = await client.auth.getSettings();
      if (!authSettings.external || authSettings.external.email !== true) throw new Error('Email sign-in is disabled in this Supabase project. Open Authentication → Providers → Email and enable it.');
      if (mode === 'signup') {
        if (authSettings.disable_signup) throw new Error('New account registration is disabled in Supabase. Enable signups in Authentication settings or ask the owner to invite users.');
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: new URL('index.html', location.href).toString() } });
        if (error) throw error;
        $('password').value = '';
        if (!data.session || !data.user) {
          setStatus('Account request created. Check your email for the confirmation link, then return here and sign in.', 'ok');
        } else {
          setStatus('Account created. Checking your access role…', 'ok');
          await determineRole(data.user);
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        $('password').value = '';
        await determineRole(data.user);
      }
    } catch (error) {
      setStatus(error.message || 'Authentication failed. Check your account and connection.', 'error');
    } finally { busy(false); }
  });

  $('modeToggle').addEventListener('click', () => {
    mode = mode === 'signin' ? 'signup' : 'signin';
    $('formTitle').textContent = mode === 'signin' ? 'Sign in' : 'Create your account';
    $('formLead').textContent = mode === 'signin' ? 'Please log in to your account' : 'Create your CyberX user account';
    $('submitButton').textContent = mode === 'signin' ? 'Login' : 'Create Account';
    $('modeToggle').textContent = mode === 'signin' ? 'Sign Up' : 'Login';
    $('switchLabel').textContent = mode === 'signin' ? "Don't have an Account?" : 'Already have an Account?';
    $('forgotButton').classList.toggle('hidden', mode === 'signup');
    $('password').autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
  });

  async function startProviderOAuth(provider, buttonId, providerName) {
    const button = $(buttonId);
    button.disabled = true;
    if ($('rememberMe')) sessionStorage.setItem('cyberx.remember-session', $('rememberMe').checked ? 'true' : 'false');
    setStatus(`Connecting to ${providerName} securely…`);
    try {
      const client = await getClient();
      const authSettings = await client.auth.getSettings();
      const enabled = Boolean(authSettings && authSettings.external && authSettings.external[provider] === true);
      if (!enabled) throw new Error(`${providerName} sign-in is not configured yet. The owner must enable the ${providerName} provider in Supabase → Authentication → Providers and add its OAuth Client ID and Client Secret. The same CyberX role check will run after the provider returns.`);
      const redirectTo = new URL('index.html', location.href).toString();
      const queryParams = provider === 'google' ? { prompt: 'select_account' } : {};
      const { error } = await client.auth.signInWithOAuth({ provider, options: { redirectTo, queryParams } });
      if (error) throw error;
    } catch (error) {
      setStatus(String(error?.message || error || `${providerName} sign-in could not start.`), 'error');
      button.disabled = false;
    }
  }
  $('googleButton').addEventListener('click', () => startProviderOAuth('google', 'googleButton', 'Google'));
  $('facebookButton').addEventListener('click', () => startProviderOAuth('facebook', 'facebookButton', 'Facebook'));
  $('appleButton').addEventListener('click', () => startProviderOAuth('apple', 'appleButton', 'Apple'));

  $('forgotButton').addEventListener('click', async () => {
    const email = $('email').value.trim().toLowerCase();
    if (!email) return setStatus('Enter the email address for the account recovery request.', 'error');
    try {
      const client = await getClient();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: new URL('index.html', location.href).toString() });
      if (error) throw error;
      setStatus('Password recovery requested. Check the email inbox if the Supabase email provider is configured.', 'ok');
    } catch (error) { setStatus(error.message || 'Password recovery failed.', 'error'); }
  });

  function startGuestDemo() {
    sessionStorage.setItem('cyberx_guest_mode', 'true');
    localStorage.setItem('cyberx_guest_mode', 'true');
    sessionStorage.setItem('cyberx_role', 'guest');
  }
  $('guestButton').addEventListener('click', startGuestDemo);
  const homePreview = $('homepagePreviewButton');
  if (homePreview) homePreview.addEventListener('click', startGuestDemo);

  const callbackError = params.get('error_description') || params.get('error') || window.CYBERX_AUTH_CALLBACK_ERROR || (window.CyberXSupabase && window.CyberXSupabase.callbackError);
  if (callbackError) {
    setStatus('Google sign-in did not complete: ' + callbackError + ' Check the Google provider and redirect URL settings in Supabase.', 'error');
    history.replaceState({}, document.title, location.pathname);
  }

  if (validConfig() && location.protocol !== 'file:') {
    if (!callbackError) setStatus('Connecting to CyberX cloud authentication…');
    (async () => {
      try {
        const settings = await window.CyberXSupabase.getSettings();
        if (!settings.external || settings.external.email !== true) setStatus('Supabase is reachable, but email authentication is disabled. Enable the Email provider in Supabase Authentication → Providers.', 'error');
        else setStatus(settings.external.google === true ? 'CyberX cloud connected · Email and Google authentication are enabled.' : 'CyberX cloud connected · Email sign-in is enabled. Google requires a one-time OAuth provider setup.', 'ok');
      } catch (error) { setStatus('Cannot reach CyberX Supabase: ' + (error.message || String(error)), 'error'); }
      if (!callbackError) await verifySession();
    })();
  } else {
    setStatus('LIVE AUTH NOT CONFIGURED · Use Guest Demo for local browsing. Add a CyberX Project URL and publishable key to Index/supabase-config.js to enable normal accounts and developer sign-in.', 'error');
  }
})();