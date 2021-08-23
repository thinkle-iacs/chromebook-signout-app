import { writable, derived } from "svelte/store";

export let user = writable({
  email: "thinkle@innovationcharter.org",
  user_metadata: {
    full_name: "Tom H",
  },
});
export let loggedIn = derived([user], ([user]) => {
  if (user && user.email) {
    console.log("email is", user.email);
    if (
      user.email.split("@")[0].indexOf(".") == -1 &&
      user.email.split("@")[1] == "innovationcharter.org"
    ) {
      return true;
    } else {
      console.log("Invalid email", user.email);
      return false;
    }
  }
});
