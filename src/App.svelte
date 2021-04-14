<script lang="ts">
  import Checkout from "./Checkout.svelte";
  import Lookup from "./Checkout.svelte"; // fix me :)
  import Data from "./Checkout.svelte";
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
  router("/lookup/:lasid", (ctx) => {
    params.lasid = ctx.params.lasid;
    page = Lookup;
  });
  router("/lookup/", (ctx) => {
    params = {};
    page = Lookup;
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

<nav class="w3-bar">
  <a class="w3-bar-item w3-button" href="/checkout" on:click={l("/checkout")}
    >Sign Out Machines</a
  >
  <a class="w3-bar-item w3-button" href="/lookup" on:click={l("/lookup")}
    >Look Up Info</a
  >
  <a class="w3-bar-item w3-button" href="/data" on:click={l("/data")}>Info</a>
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
  <footer class="w3-container">
    Hi there, {$user?.user_metadata.full_name} ({$user.email})
    <a href="/user" on:click={l("/user")}>(need to log out?)</a>
  </footer>
{/if}

<style>
  nav :global(a) {
    text-decoration: none;
  }
</style>
