// ============================================================
// Banza AI — Logger centralisé
// Catégories : [HTTP] [DATABASE] [AUTH] [CHAT] [NVIDIA]
//              [STREAM] [ADMIN] [VOICE] [ERROR]
//
// Sécurité : ne JAMAIS écrire dans les logs :
//   - clés API / JWT_SECRET / DB_PASSWORD
//   - mots de passe utilisateur
//   - cookies complets / tokens sensibles
// ============================================================

const SENSITIVE_PATTERNS = [
  /(Bearer\s+)[A-Za-z0-9\-._~+/]+/gi,
  /(X-Guest-Token['":\s=]+)[a-f0-9]{16,}/gi,
  /(session_token['":\s=]+)[a-f0-9]{16,}/gi,
  /(api[_-]?key['":\s=]+)[^\s,"']+/gi,
  /(password['":\s=]+)[^\s,"']+/gi,
  /(passwd['":\s=]+)[^\s,"']+/gi,
  /(secret['":\s=]+)[^\s,"']+/gi,
  /(authorization['":\s=]+)[^\s,"']+/gi,
  /(NVIDIA_API_KEY|DB_PASSWORD|JWT_SECRET)\s*=\s*\S+/gi,
];

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-guest-token",
  "password",
  "passwd",
  "token",
  "session_token",
  "secret",
  "apikey",
  "api_key",
  "db_password",
  "jwt_secret",
]);

function redact(value) {
  let out = String(value);
  for (const re of SENSITIVE_PATTERNS) {
    out = out.replace(re, (m, prefix) => `${prefix ?? ""}[REDACTED]`);
  }
  return out;
}

function sanitizeArg(arg) {
  if (arg === null || arg === undefined) return arg;
  if (typeof arg === "string") return redact(arg);
  if (typeof arg === "object") {
    if (Array.isArray(arg)) return arg.map(sanitizeArg);
    const out = {};
    for (const [k, v] of Object.entries(arg)) {
      if (SENSITIVE_KEYS.has(String(k).toLowerCase())) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitizeArg(v);
      }
    }
    return out;
  }
  return arg;
}

function ts() {
  return new Date().toISOString();
}

function write(level, tag, message, ...args) {
  const safeArgs = args.map(sanitizeArg);
  const line = safeArgs.length
    ? `[${ts()}] [${level}] [${tag}] ${redact(message)} ${safeArgs
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ")}`
    : `[${ts()}] [${level}] [${tag}] ${redact(message)}`;
  // eslint-disable-next-line no-console
  console.log(line);
}

/** Logue un objet structuré (toujours chiffres/clés sûres). */
function object(tag, data) {
  const safe = sanitizeArg(data);
  const line = `[${ts()}] [${tag}] ${JSON.stringify(safe)}`;
  // eslint-disable-next-line no-console
  console.log(line);
}

export const logger = {
  http: (message, ...args) => write("INFO", "HTTP", message, ...args),
  database: (message, ...args) => write("INFO", "DATABASE", message, ...args),
  auth: (message, ...args) => write("INFO", "AUTH", message, ...args),
  chat: (message, ...args) => write("INFO", "CHAT", message, ...args),
  nvidia: (message, ...args) => write("INFO", "NVIDIA", message, ...args),
  stream: (message, ...args) => write("INFO", "STREAM", message, ...args),
  admin: (message, ...args) => write("INFO", "ADMIN", message, ...args),
  voice: (message, ...args) => write("INFO", "VOICE", message, ...args),
  warn: (message, ...args) => write("WARN", "WARN", message, ...args),
  error: (message, ...args) => write("ERROR", "ERROR", message, ...args),
  object,
};