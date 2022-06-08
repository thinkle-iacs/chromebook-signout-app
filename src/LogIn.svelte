<script>
  import netlifyIdentity from "netlify-identity-widget";
  import { onMount } from "svelte";
  import { user, loggedIn } from "./data/user";
  import { l } from "./util";

  onMount(() => {
    netlifyIdentity.init();
    $user = netlifyIdentity.currentUser();
    // Bind to events
    netlifyIdentity.on("init", (u) => console.log("init", u));
    netlifyIdentity.on("login", (u) => {
      console.log("login", u);
      $user = u;
    });
    netlifyIdentity.on("logout", () => {
      console.log("Logged out");
      $user = null;
    });
    netlifyIdentity.on("error", (err) => console.error("Error", err));
    netlifyIdentity.on("open", () => console.log("Widget opened"));
    netlifyIdentity.on("close", () => console.log("Widget closed"));

    // Unbind from events
    //netlifyIdentity.off("login"); // to unbind all registered handlers
    //netlifyIdentity.off("login", handler); // to unbind a single handler

    // Close the modal
    //netlifyIdentity.close();

    // Log out the user
    //netlifyIdentity.logout();

    // Refresh the user's JWT
    // Call in on('login') handler to ensure token refreshed after it expires (1hr)
    // Note: this method returns a promise.
    /* try {
      netlifyIdentity.refresh().then((jwt) => console.log(jwt));
    } catch (err) {
      console.log("Error refreshing?", err);
    } */

    // Change language
    netlifyIdentity.setLocale("en");
  });
</script>

<div class="w3-card w3-container w3-center w3-padding-64">
  {#if !$user}
    <p>
      You will be logging in through <b>netlify.com</b>, the service that is
      hosting this webpage.
    </p>
    <p>
      You need to click the <b>"Continue with Google"</b> button and use your IACS
      google account.
    </p>
    <p>DO NOT enter your email/password directly &mdash; it won't work.</p>
    <p>
      After you've logged in, you have to close the pop-up by clicking the "x"
    </p>
    <p>You will be tempted to just click "Log Out" - don't do that :)</p>
    <button
      class="w3-button w3-blue"
      on:click={() => netlifyIdentity.open("login")}
    >
      Log In
    </button>
  {:else}
    <button
      class="w3-button w3-border"
      on:click={() => netlifyIdentity.logout()}
    >
      Log Out
    </button>
  {/if}

  {#if $loggedIn}
    <a href="/" on:click={l("/")} class="w3-buton"> Back to the App... </a>
  {/if}
</div>
{#if $user && !$loggedIn}
  <div class="w3-card w3-red">
    <p>Sorry, looks like you are not authorized :(</p>
    <p>{user.email} is not on my list</p>
  </div>
{/if}
