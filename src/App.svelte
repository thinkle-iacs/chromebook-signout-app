<script lang="ts">
  import Checkout from "./Checkout.svelte";
  import LookupAsset from "./LookupAsset.svelte";
  import LookupStudent from "./LookupStudent.svelte";
  import History from "./History.svelte";
  import router from "page";
  import LogIn from "./LogIn.svelte";
  import { loggedIn, user } from "./user";
  import { l } from "./util";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  let title = "IACS Chromebook Signout";
  let page = Checkout;
  let params: {
    name?: string;
    tag?: string;
  } = {};
  onMount(() => {
    router("/user", () => {
      page = LogIn;
      title = "IACS Chromebook Signout Log In";
    });
    router("/", () => {
      page = Checkout;
      title = "IACS Chromebook Signout";
    });
    router("/student/", (ctx) => {
      page = LookupStudent;
      title = "IACS Chromebook Student Lookup";
    });
    router("/student/:name", (ctx) => {
      params.name = ctx.params.name;
      page = LookupStudent;
      title = "IACS Chromebook Student Lookup";
    });
    router("/asset/", (ctx) => {
      params = {};
      page = LookupAsset;
      title = "IACS Chromebook Lookup";
    });
    router("/asset/:tag", (ctx) => {
      params = {};
      params.tag = ctx.params.tag;
      page = LookupAsset;
      title = "IACS Chromebook Lookup";
    });
    router("/checkout/", (ctx) => {
      params = {};
      page = Checkout;
      title = "IACS Chromebook Signout";
    });
    router("/history/", (ctx) => {
      page = History;
      title = "IACS Chromebook Signout History";
    });
    router.start();
  });
  let navActive;
</script>

<div
  class="w3-main"
  on:click={() => {
    navActive = false;
  }}
>
  <nav class="w3-sidebar w3-light-grey" class:navActive>
    <button
      on:click={() => {
        navActive = false;
      }}
      class="mobileNav w3-button close-button">&times;</button
    >
    <a
      class="w3-bar-item w3-button"
      href="/checkout"
      on:click={l("/checkout")}
      class:active={page == Checkout}
      class:w3-blue={page == Checkout}>Sign In/Out</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == LookupAsset}
      href="/asset/"
      on:click={l("/asset/")}
      class:w3-blue={page == LookupAsset}>Look Up Info</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == LookupStudent}
      class:w3-blue={page == LookupStudent}
      href="/students/"
      on:click={l("/student/")}>Look Up Student</a
    >
    <a
      class="w3-bar-item w3-button"
      class:active={page == History}
      class:w3-blue={page == History}
      href="/history/"
      on:click={l("/history/")}>Signout History</a
    >
  </nav>
  <main>
    <header class="w3-bar w3-blue">
      <button
        class="mobileNav w3-bar-item w3-blue"
        on:click={(e) => {
          console.log("mobileNav click!");
          navActive = true;
          e.stopPropagation();
        }}>☰</button
      >
      <h1 class="w3-bar-item w3-center w3-blue">
        {title}
      </h1>
    </header>

    {#if !$loggedIn}
      <LogIn />
    {:else if page}
      <!-- This each logic had been there, presumably to 
    try to fix some problem w/ stale data? At any rate, it seems that
    by eliminating it I'm eliminating a buggy situation where I had multiple
    pages rendering on top of each other.
     -->
      <!-- {#each [page] as page (page)} -->
      {#if page == History}
        <div in:fade><History {...params} /></div>
      {:else if page == LookupAsset}
        <div in:fade><LookupAsset {...params} /></div>
      {:else if page == Checkout}
        <div in:fade><Checkout {...params} /></div>
      {:else if page == LookupStudent}
        <div in:fade><LookupStudent {...params} /></div>
      {:else}
        <div>
          Unknown Page? {page}
        </div>
      {/if}
      <!-- {/each} -->
    {:else}
      Weird, nobody's home
    {/if}
  </main>
</div>
{#if $loggedIn}
  <footer class="w3-container w3-cell w3-cell-bottom w3-white">
    Hi there, {$user?.user_metadata.full_name} ({$user.email})
    <a href="/user" on:click={l("/user")}>(need to log out?)</a>
  </footer>
{/if}

<style>
  header {
    display: flex;
  }
  header h1 {
    margin-left: auto;
    margin-right: auto;
  }
  main {
    padding-bottom: 96px;
    margin-left: 200px;
  }
  nav :global(a) {
    text-decoration: none;
    width: 200px;
  }

  .mobileNav {
    display: none;
  }
  @media screen and (max-width: 960px) {
    .mobileNav {
      display: initial;
    }
    .close-button {
      display: flex;
      margin-left: auto;
    }
    main {
      margin-left: 0px;
    }

    nav {
      display: block;
      overflow: hidden;
      width: 0px;
      transition: width 200ms;
    }

    nav.navActive {
      display: block;
      width: 200px;
    }
  }
  nav a {
    transition: background-color 500ms;
  }

  footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 64px;
  }

  .active:hover {
    background-color: #2196f3 !important;
  }
  h1 {
    margin-top: 0;
  }
</style>
