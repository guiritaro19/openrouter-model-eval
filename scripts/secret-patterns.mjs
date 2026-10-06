export function hasSecret(text) {
  return /sk-(?:or-v1-|proj-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i.test(text)
    || /(?:OPENROUTER_API_KEY|OPENAI_API_KEY|LANGFUSE_SECRET_KEY|QDRANT_API_KEY|DATABASE_URL)["']?[ \t]*[:=][ \t]*["']?(?!["']?(?:\{\{|\$\{|process\.|$))[A-Za-z0-9][^\s"',;\\]{7,}/im.test(text);
}
