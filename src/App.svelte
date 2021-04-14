<script lang="ts">
  import Checkout from "./Checkout.svelte";
  import Lookup from "./Checkout.svelte"; // fix me :)
  import Data from "./Checkout.svelte";
  import router from "page";

  let page = Checkout;
  let params: {
    lasid?: string;
  } = {};
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
  function l(path) {
    return (e) => {
      router(path);
      console.log("Linked to", path, "now don't click");
      console.log("Event is", e);
      e.preventDefault();
      return false;
    };
  }
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
  {#if page}
    <svelte:component this={page} {...params} />
  {:else}
    Weird, nobody's home
  {/if}
</main>

<style>
  nav :global(a) {
    text-decoration: none;
  }
</style>
