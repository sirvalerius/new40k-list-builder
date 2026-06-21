// Cloudflare Worker: receives bug-feedback from the (static) app and appends it to
// FEEDBACK.md in the GitHub repo via the Contents API. The GitHub token is stored as a
// Worker secret (GITHUB_TOKEN) and never reaches the browser, so testers submit anonymously.
//
// Vars (wrangler.toml): GITHUB_REPO, FEEDBACK_FILE, ALLOWED_ORIGIN
// Secret: GITHUB_TOKEN  (fine-grained PAT, Contents: Read and write on the repo)

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Bad JSON' }, 400, cors);
    }
    // honeypot: bots fill hidden fields — silently accept, write nothing
    if (body.website) return json({ ok: true }, 200, cors);

    const message = String(body.message || '').trim();
    const context = String(body.context || '').slice(0, 500);
    const list = String(body.list || '').slice(0, 20000); // attached current list dump
    if (!message) return json({ error: 'Empty message' }, 400, cors);
    if (message.length > 4000) return json({ error: 'Too long' }, 400, cors);

    const repo = env.GITHUB_REPO;
    const file = env.FEEDBACK_FILE || 'FEEDBACK.md';
    const api = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(file)}`;
    const token = String(env.GITHUB_TOKEN || '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
    const gh = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'new40k-feedback-worker',
    };
    const entry = formatEntry(message, context, list);

    // read-modify-write; retry once if the file's sha changed underneath us (409)
    for (let attempt = 0; attempt < 2; attempt++) {
      let sha = null;
      let current = '';
      const getRes = await fetch(`${api}?ref=main`, { headers: gh });
      if (getRes.status === 200) {
        const data = await getRes.json();
        sha = data.sha;
        current = decodeUtf8(data.content || '');
      } else if (getRes.status !== 404) {
        return json({ error: 'Read failed' }, 502, cors);
      }
      const putRes = await fetch(api, {
        method: 'PUT',
        headers: { ...gh, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `feedback: ${message.slice(0, 50).replace(/\s+/g, ' ')}`,
          content: encodeUtf8(current + entry),
          branch: 'main',
          ...(sha ? { sha } : {}),
        }),
      });
      if (putRes.ok) return json({ ok: true }, 200, cors);
      if (putRes.status === 409) continue; // concurrent write — re-read and retry
      return json({ error: 'Write failed' }, 502, cors);
    }
    return json({ error: 'Conflict, retry' }, 409, cors);
  },
};

function formatEntry(message, context, list) {
  const ts = new Date().toISOString();
  const ctx = context ? `\n_${context}_\n` : '';
  const dump = list
    ? `\n\n<details><summary>Current list</summary>\n\n\`\`\`json\n${list}\n\`\`\`\n</details>\n`
    : '';
  return `\n---\n### ${ts}\n${ctx}\n${message}\n${dump}`;
}

function encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function decodeUtf8(b64) {
  const bin = atob(String(b64).replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
