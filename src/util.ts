import router from "page";

export function l(path: string) {
  return (e: Event) => {
    router(path);
    e.preventDefault();
    return false;
  };
}
