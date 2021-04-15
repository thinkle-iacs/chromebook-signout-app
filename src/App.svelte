<script lang="ts">
  import Checkout from "./Checkout.svelte";
  import LookupAsset from "./LookupAsset.svelte";
  import LookupStudent from "./LookupStudent.svelte";
  import router from "page";
  import LogIn from "./LogIn.svelte";
  import { loggedIn, user } from "./user";
  import { l } from "./util";
  let page = Checkout;
  let params: {
    lasid?: string;
  } = {};
  router("/user", () => {
    page = LogIn;
  });
  router("/", () => {
    page = Checkout;
  });
  router("/student/", (ctx) => {
    page = LookupStudent;
  });
  router("/student/:lasid", (ctx) => {
    params.lasid = ctx.params.lasid;
    page = LookupStudent;
  });
  router("/asset/", (ctx) => {
    params = {};
    page = LookupAsset;
  });
  router("/checkout/", (ctx) => {
    params = {};
    page = Checkout;
  });
  router("/data/", (ctx) => {
    params = {};
    page = Data;
  });
  router.start();
</script>

<nav class="w3-bar w3-border w3-light-grey">
  <a
    class="w3-bar-item w3-button"
    href="/checkout"
    on:click={l("/checkout")}
    class:w3-blue={page == Checkout}>Sign In/Out</a
  >
  <a
    class="w3-bar-item w3-button"
    href="/asset/"
    on:click={l("/asset/")}
    class:w3-blue={page == LookupAsset}>Look Up Info</a
  >
  <a
    class="w3-bar-item w3-button"
    class:w3-blue={page == LookupStudent}
    href="/students/"
    on:click={l("/student/")}>Look Up Student</a
  >
</nav>

<main class="w3-main">
  {#if !$loggedIn}
    <LogIn />
  {:else if page}
    <svelte:component this={page} {...params} />
  {:else}
    Weird, nobody's home
  {/if}
</main>
{#if $loggedIn}
  <footer class="w3-container w3-cell w3-cell-bottom">
    Hi there, {$user?.user_metadata.full_name} ({$user.email})
    <a href="/user" on:click={l("/user")}>(need to log out?)</a>
  </footer>
{/if}

<style>
  main {
    min-height: calc(100vh - 128px);
  }
  nav :global(a) {
    text-decoration: none;
  }
</style>
