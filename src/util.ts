import router from "page";

export function l(path: string) {
  return (e: Event) => {
    router(path);
    e.preventDefault();
    return false;
  };
}

export function parseMarkdown(m) {
  m = m.replace(/\n/g, "<br>");
  m = m.replace(/[*]([^*]+)[*]/, "<i>$1</i>");
  return m;
}
