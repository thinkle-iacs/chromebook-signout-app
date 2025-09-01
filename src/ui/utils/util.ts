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

export function isValidEmail(email: string) {
  if (!email) return false;
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function withLoadingIndicator(asyncCall, loadingStore, key = null) {
  const setStore = (bool) => {
    if (key) {
      loadingStore.update((s) => ({ ...s, [key]: bool }));
    } else {
      loadingStore.set(bool);
    }
  };

  return async (...args) => {
    setStore(true);
    try {
      const result = await asyncCall(...args);
      setStore(false);
      return result;
    } catch (error) {
      setStore(false);
      throw error;
    }
  };
}
