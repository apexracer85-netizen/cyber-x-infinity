/*
 * CyberX Supabase REST/Auth client.
 * Uses Supabase's documented Auth and PostgREST HTTP endpoints directly so
 * login does not depend on a separately loaded SDK/CDN module.
 * Only the public publishable key belongs in the browser.
 */
(function (w) {
  'use strict';
  const cfg = w.CYBERX_SUPABASE_CONFIG || {};
  const baseUrl = String(cfg.url || '').replace(/\/+$/, '');
  const apiKey = String(cfg.publishableKey || '').trim();
  const STORE_KEY = 'cyberx.supabase.session.v1';
  const TIMEOUT_MS = 18000;
  let refreshPromise = null;

  function validConfig() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(baseUrl) &&
      /^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)$/.test(apiKey);
  }
  function rememberSession() { return sessionStorage.getItem('cyberx.remember-session') !== 'false'; }
  function readSession() {
    try {
      if (!rememberSession()) return JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null');
      return JSON.parse(localStorage.getItem(STORE_KEY) || sessionStorage.getItem(STORE_KEY) || 'null');
    } catch (_) { return null; }
  }
  function saveSession(session) {
    if (!session || !session.access_token || !session.refresh_token) return;
    const exp = Number(session.expires_at || 0) || (Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600));
    const clean = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: session.token_type || 'bearer',
      expires_in: Number(session.expires_in || Math.max(0, exp - Math.floor(Date.now() / 1000))),
      expires_at: exp,
      user: session.user || null
    };
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    (rememberSession() ? localStorage : sessionStorage).setItem(STORE_KEY, JSON.stringify(clean));
    w.dispatchEvent(new CustomEvent('cyberx-auth-state', { detail: { event: 'SIGNED_IN', session: clean } }));
  }
  function clearSession() {
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    w.dispatchEvent(new CustomEvent('cyberx-auth-state', { detail: { event: 'SIGNED_OUT', session: null } }));
  }
  function responseError(payload, status) {
    const msg = payload && (payload.msg || payload.message || payload.error_description || payload.error);
    const error = new Error(msg ? String(msg) : `Supabase request failed (${status}).`);
    error.status = status;
    error.code = payload && (payload.code || payload.error_code);
    error.details = payload && payload.details;
    return error;
  }
  async function request(path, options = {}) {
    if (!validConfig()) throw new Error('CyberX Supabase settings are missing or invalid. Check Index/supabase-config.js.');
    if (!options.noAuth && readSession()) await ensureFreshSession();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const session = options.noAuth ? null : readSession();
    const headers = new Headers(options.headers || {});
    headers.set('apikey', apiKey);
    headers.set('Authorization', `Bearer ${session && session.access_token ? session.access_token : apiKey}`);
    if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    try {
      const response = await fetch(baseUrl + path, {
        method: options.method || 'GET', headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        mode: 'cors', credentials: 'omit', cache: 'no-store'
      });
      const raw = await response.text();
      let payload = null;
      if (raw) { try { payload = JSON.parse(raw); } catch (_) { payload = raw; } }
      if (!response.ok) throw responseError(payload, response.status);
      return payload;
    } catch (error) {
      if (error && error.name === 'AbortError') throw new Error('Supabase did not respond within 18 seconds. Check your internet connection, firewall, or Supabase project status, then retry.');
      if (error instanceof TypeError) throw new Error('Could not reach Supabase. Check your internet connection or browser network restrictions, then retry.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function refreshSession() {
    const current = readSession();
    if (!current || !current.refresh_token) return null;
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const data = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', noAuth: true, body: { refresh_token: current.refresh_token }
      });
      saveSession(data);
      return readSession();
    })();
    try { return await refreshPromise; }
    catch (error) { clearSession(); throw error; }
    finally { refreshPromise = null; }
  }
  async function ensureFreshSession() {
    let session = readSession();
    if (!session) return null;
    const now = Math.floor(Date.now() / 1000);
    if (Number(session.expires_at || 0) < now + 60) session = await refreshSession();
    return session;
  }
  function captureImplicitCallback() {
    if (!location.hash || location.hash.length < 2) return;
    const params = new URLSearchParams(location.hash.slice(1));
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');
    const error = params.get('error_description') || params.get('error');
    if (error) w.CYBERX_AUTH_CALLBACK_ERROR = error;
    if (access && refresh) {
      const expiresIn = Number(params.get('expires_in') || 3600);
      const session = {
        access_token: access, refresh_token: refresh,
        token_type: params.get('token_type') || 'bearer',
        expires_in: expiresIn,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn
      };
      saveSession(session);
      history.replaceState(null, document.title, location.pathname + location.search);
    } else if (error) {
      history.replaceState(null, document.title, location.pathname + location.search);
    }
  }
  captureImplicitCallback();

  async function getUser() {
    const session = await ensureFreshSession();
    if (!session || !session.access_token) return null;
    const user = await request('/auth/v1/user');
    const current = readSession();
    if (current) {
      current.user = user;
      const targetStore = rememberSession() ? localStorage : sessionStorage;
      const otherStore = rememberSession() ? sessionStorage : localStorage;
      otherStore.removeItem(STORE_KEY);
      targetStore.setItem(STORE_KEY, JSON.stringify(current));
    }
    return user;
  }
  function authApi() {
    return {
      async getSession() {
        const session = await ensureFreshSession();
        return { data: { session }, error: null };
      },
      async getSettings() {
        return await request('/auth/v1/settings', { noAuth: true });
      },
      async getUser() {
        try { return { data: { user: await getUser() }, error: null }; }
        catch (error) { return { data: { user: null }, error }; }
      },
      async signInWithPassword({ email, password }) {
        const data = await request('/auth/v1/token?grant_type=password', {
          method: 'POST', noAuth: true, body: { email, password }
        });
        saveSession(data);
        return { data: { user: data.user || null, session: readSession() }, error: null };
      },
      async signUp({ email, password, options = {} }) {
        const redirect = options.emailRedirectTo || options.redirectTo;
        const suffix = redirect ? `?redirect_to=${encodeURIComponent(redirect)}` : '';
        const data = await request('/auth/v1/signup' + suffix, {
          method: 'POST', noAuth: true, body: { email, password }
        });
        if (data && data.access_token && data.refresh_token) saveSession(data);
        return { data: { user: data && data.user || data || null, session: readSession() }, error: null };
      },
      async signInWithOAuth({ provider, options = {} }) {
        const redirectTo = options.redirectTo || (location.origin + location.pathname);
        const url = new URL(baseUrl + '/auth/v1/authorize');
        url.searchParams.set('provider', provider);
        url.searchParams.set('redirect_to', redirectTo);
        if (options.scopes) url.searchParams.set('scopes', options.scopes);
        Object.entries(options.queryParams || {}).forEach(([key, value]) => url.searchParams.set(key, String(value)));
        location.assign(url.toString());
        return { data: { provider, url: url.toString() }, error: null };
      },
      async resetPasswordForEmail(email, options = {}) {
        const redirect = options.redirectTo;
        const suffix = redirect ? `?redirect_to=${encodeURIComponent(redirect)}` : '';
        await request('/auth/v1/recover' + suffix, { method: 'POST', noAuth: true, body: { email } });
        return { data: {}, error: null };
      },
      async signOut() {
        const session = readSession();
        try {
          if (session && session.access_token) await request('/auth/v1/logout', { method: 'POST' });
        } finally { clearSession(); }
        return { error: null };
      }
    };
  }
  class RestQuery {
    constructor(table) { this.table = table; this.params = new URLSearchParams(); this.method = 'GET'; this.body = undefined; this.prefer = ''; }
    select(columns = '*') { this.params.set('select', columns); if (this.method === 'POST' || this.method === 'PATCH') this.prefer = 'return=representation'; return this; }
    eq(column, value) { this.params.append(column, 'eq.' + String(value)); return this; }
    order(column, options = {}) { this.params.append('order', `${column}.${options.ascending === false ? 'desc' : 'asc'}`); return this; }
    limit(count) { this.params.set('limit', String(count)); return this; }
    insert(body) { this.method = 'POST'; this.body = body; this.prefer = 'return=minimal'; return this; }
    upsert(body, options = {}) {
      this.method = 'POST';
      this.body = body;
      this.prefer = 'resolution=merge-duplicates,return=minimal';
      const conflict = String(options.onConflict || 'id').trim();
      if (conflict) this.params.set('on_conflict', conflict);
      return this;
    }
    async execute(single = false) {
      const query = this.params.toString();
      const headers = {};
      if (this.prefer) headers.Prefer = this.prefer;
      try {
        const data = await request('/rest/v1/' + encodeURIComponent(this.table) + (query ? '?' + query : ''), { method: this.method, body: this.body, headers });
        if (single) {
          if (!Array.isArray(data)) return { data: data || null, error: null };
          if (data.length > 1) throw new Error('Expected zero or one database row but received multiple rows.');
          return { data: data[0] || null, error: null };
        }
        return { data, error: null };
      } catch (error) { return { data: null, error }; }
    }
    maybeSingle() { return this.execute(true); }
    single() { return this.execute(true); }
    then(resolve, reject) { return this.execute(false).then(resolve, reject); }
  }
  function createClient() {
    return {
      auth: authApi(),
      from(table) { return new RestQuery(table); },
      async rpc(name, args = {}) {
        try { const data = await request('/rest/v1/rpc/' + encodeURIComponent(name), { method: 'POST', body: args }); return { data, error: null }; }
        catch (error) { return { data: null, error }; }
      }
    };
  }
  w.CyberXSupabase = { createClient, validConfig, readSession, clearSession, refreshSession, getUser, getSettings: () => request('/auth/v1/settings', { noAuth: true }), callbackError: w.CYBERX_AUTH_CALLBACK_ERROR || null };
})(window);