import ScheduleTester from "./ScheduleTester.svelte";
import TestMenu from "./TestMenu.svelte";
import SisTest from "./SISTest.svelte";
import LoaderTest from "./ui/LoaderTest.svelte";

ScheduleTester;

export const testRoutes = {
  "/test/": {
    page: TestMenu,
    title: "Test Menu",
  },
  "/test/schedule": {
    page: ScheduleTester,
    title: "Schedule Structure Tester",
  },
  "/test/sis": {
    page: SisTest,
    title: "SIS API Test Tool",
  },
  "/test/ui/loader": {
    page: LoaderTest,
    title: "UI Loader Test",
  },
};
