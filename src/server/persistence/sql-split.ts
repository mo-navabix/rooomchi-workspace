/**
 * Split a PostgreSQL script into statements on semicolons outside of
 * strings, identifiers, and dollar-quoted blocks.
 */
export function splitPostgresSql(sql: string): string[] {
  const statements: string[] = [];
  let buf = "";
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const ch = sql[i];
    const next = i + 1 < len ? sql[i + 1] : "";

    if (ch === "-" && next === "-") {
      i += 2;
      while (i < len && sql[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < len - 1 && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    if (ch === "$") {
      let j = i + 1;
      while (j < len && sql[j] !== "$") j++;
      if (j >= len) {
        throw new Error("Unterminated dollar-quoted string");
      }
      const delim = sql.slice(i, j + 1);
      const close = sql.indexOf(delim, j + 1);
      if (close === -1) {
        throw new Error("Unterminated dollar-quoted string");
      }
      buf += sql.slice(i, close + delim.length);
      i = close + delim.length;
      continue;
    }

    if (ch === "'") {
      buf += ch;
      i++;
      while (i < len) {
        if (sql[i] === "'") {
          buf += sql[i++];
          if (i < len && sql[i] === "'") {
            buf += sql[i++];
            continue;
          }
          break;
        }
        buf += sql[i++];
      }
      continue;
    }

    if (ch === '"') {
      buf += ch;
      i++;
      while (i < len) {
        if (sql[i] === '"') {
          buf += sql[i++];
          if (i < len && sql[i] === '"') {
            buf += sql[i++];
            continue;
          }
          break;
        }
        buf += sql[i++];
      }
      continue;
    }

    if (ch === ";") {
      const trimmed = buf.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      buf = "";
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  const tail = buf.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}
