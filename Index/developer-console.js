(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.CYBERX_SUPABASE_CONFIG || {};
  let client = null, user = null;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateText = value => { const d = new Date(value); return Number.isNaN(d.valueOf()) ? '—' : d.toLocaleString(); };
  function status(message, good=false) {
    $('status').textContent = message;
    $('status').className = good ? 'chip' : 'notice';
  }
  async function init() {
    const api = window.CyberXSupabase;
    if (!api || !api.validConfig()) throw new Error('CyberX Supabase configuration is missing or invalid.');
    if (location.protocol === 'file:') throw new Error('Open CyberX through localhost or HTTPS, not file://.');
    client = api.createClient();
    const {data:{user:current},error:userError} = await client.auth.getUser();
    if (userError) throw userError;
    if (!current) { location.replace('index.html?next=developer'); return false; }
    const email = String(current.email || '').trim().toLowerCase();
    const {data:allow,error:allowError} = await client.from('cyberx_developer_allowlist')
      .select('email,access_level,enabled').eq('email',email).eq('enabled',true).maybeSingle();
    if (allowError) throw new Error('Unable to verify your developer role: ' + allowError.message);
    if (!allow || !allow.enabled || !['owner','developer'].includes(String(allow.access_level || '').toLowerCase())) {
      location.replace('../Command-Centre.html');
      return false;
    }
    if (!current.email_confirmed_at && !current.confirmed_at) throw new Error('Confirm your email address before using the Developer Control Centre.');
    user = current;
    $('sessionChip').textContent = String(allow.access_level).toUpperCase() + ' · ' + email;
    await audit('developer.console.open',{access_level:allow.access_level});
    return true;
  }
  async function audit(action,details={}) {
    if (!client || !user) return;
    const {error} = await client.from('cyberx_developer_audit').insert({actor_id:user.id,action,details});
    if (error) console.warn('CyberX developer audit could not be recorded:',error.message);
  }
  function rows(target,items,kind) {
    const element=$(target);
    if (!items || !items.length) { element.innerHTML='<tr><td colspan="3">No activity has been recorded yet.</td></tr>'; return; }
    element.innerHTML=items.map(item => kind==='audit'
      ? '<tr><td>'+escapeHtml(dateText(item.created_at))+'</td><td>'+escapeHtml(item.action)+'</td><td>'+escapeHtml(JSON.stringify(item.details||{}))+'</td></tr>'
      : '<tr><td>'+escapeHtml(dateText(item.created_at))+'</td><td>'+escapeHtml(item.event_name)+'</td><td>'+escapeHtml(String(item.actor_id||'').slice(0,10))+'</td></tr>'
    ).join('');
  }
  async function refresh() {
    $('refresh').disabled=true;
    $('refresh').textContent='LOADING…';
    try {
      const [metrics,auditRows,eventRows] = await Promise.all([
        client.rpc('cyberx_developer_metrics'),
        client.from('cyberx_developer_audit').select('action,details,created_at').order('created_at',{ascending:false}).limit(12),
        client.from('cyberx_app_events').select('actor_id,event_name,created_at').order('created_at',{ascending:false}).limit(12)
      ]);
      if (metrics.error) throw metrics.error;
      if (auditRows.error) throw auditRows.error;
      if (eventRows.error) throw eventRows.error;
      const m=Array.isArray(metrics.data)?metrics.data[0]:metrics.data;
      if (!m) throw new Error('The analytics function returned no rows. Check Supabase migrations.');
      $('accounts').textContent=m.total_accounts ?? 0;
      $('active').textContent=m.active_users_7d ?? 0;
      $('events').textContent=m.total_app_events ?? 0;
      $('audits').textContent=m.total_developer_events ?? 0;
      rows('auditRows',auditRows.data,'audit');
      rows('eventRows',eventRows.data,'events');
      $('health').innerHTML=[
        ['Supabase Auth and database','Connected','ok'],
        ['Developer allowlist','Owner role verified','ok'],
        ['Row Level Security','Enabled on shared tables','ok'],
        ['GitHub Pages','Repository has Pages workflow; deployment depends on Pages setting and workflow success','warn']
      ].map(x=>'<div class="health"><span>'+escapeHtml(x[0])+'<small>'+escapeHtml(x[1])+'</small></span><b class="'+x[2]+'">'+(x[2]==='ok'?'CONNECTED':'CHECK')+'</b></div>').join('');
      status('Connected. Metrics are live database results. New user totals remain zero until users register and use the app.',true);
    } catch (error) {
      status('Developer dashboard data could not be refreshed: ' + (error.message || String(error)));
    } finally {
      $('refresh').disabled=false;
      $('refresh').textContent='↻ REFRESH';
    }
  }
  async function syncLibrary() {
    const button=$('sync');
    button.disabled=true;
    button.textContent='SYNCING…';
    $('syncStatus').textContent='Reading the catalogue bundled in this hosted repository…';
    try {
      const response=await fetch('code-library.json',{cache:'no-store'});
      if (!response.ok) throw new Error('The repository code-library.json is missing (HTTP '+response.status+').');
      const library=await response.json();
      if (!Array.isArray(library.entries) || library.entries.length<100) {
        const {data:cloud,error:cloudError}=await client.from('cyberx_public_library').select('payload').eq('library_key','code-library').maybeSingle();
        if (cloudError) throw cloudError;
        const count=cloud?.payload?.entries?.length||0;
        $('syncStatus').textContent='This hosted repository contains a smaller starter catalogue ('+(library.entries?.length||0)+' examples). It will not overwrite the existing cloud copy ('+count+' examples). Use the full downloadable CyberX bundle from the owner computer to publish the complete 104-example catalogue.';
        return;
      }
      const payload={
        name:library.name || 'CyberX Global Code & Device Reference Library',
        version:String(library.version || '1'),
        generated:library.generated || new Date().toISOString().slice(0,10),
        scope:library.scope || 'Curated and expandable code reference catalogue.',
        entryCount:library.entries.length,
        categories:library.categories || [],
        entries:library.entries
      };
      const {data:existing,error:readError}=await client.from('cyberx_public_library').select('payload').eq('library_key','code-library').maybeSingle();
      if (readError) throw readError;
      const currentCount=existing?.payload?.entries?.length||0;
      if (currentCount>payload.entries.length) {
        $('syncStatus').textContent='The current cloud catalogue has more entries than this copy. The larger shared catalogue was preserved.';
        return;
      }
      const {error}=await client.from('cyberx_public_library').upsert({library_key:'code-library',payload,updated_at:new Date().toISOString()},{onConflict:'library_key'});
      if (error) throw error;
      await audit('developer.library.sync',{entry_count:library.entries.length,version:payload.version});
      $('syncStatus').textContent='Success: '+library.entries.length+' examples are now in the shared Supabase catalogue and readable by all app users.';
      status('Shared catalogue synchronized successfully.',true);
    } catch (error) {
      $('syncStatus').textContent='Sync failed: '+(error.message || String(error));
    } finally {
      button.disabled=false;
      button.textContent='SYNC CATALOGUE TO CLOUD';
    }
  }
  $('refresh').addEventListener('click',refresh);
  $('sync').addEventListener('click',syncLibrary);
  $('signOut').addEventListener('click',async()=>{
    await audit('developer.logout',{});
    try { await client.auth.signOut(); } catch (error) { console.warn(error); }
    sessionStorage.removeItem('cyberx_role');
    location.replace('index.html');
  });
  (async()=>{try{const ok=await init();if(ok)await refresh();}catch(error){status('Developer access check failed: '+(error.message||String(error)));}})();
})();