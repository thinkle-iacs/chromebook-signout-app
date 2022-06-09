import router from "page";

export function l(path: string) {
  return (e: Event) => {
    router(path);
    e.preventDefault();
    return false;
  };
}

export function parseMarkdown(m) {
  if (!m) {
    return "";
  }
  if (Array.isArray(m)) {
    return m.map(parseMarkdown).join("\n");
  }
  m = m.replace(/\n/g, "<br>");
  m = m.replace(/[*]([^*]+)[*]/g, "<i>$1</i>");
  return m;
}
