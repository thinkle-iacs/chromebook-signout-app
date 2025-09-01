import ScheduleTester from "./ScheduleTester.svelte";
import TestMenu from "./TestMenu.svelte";
import SisTest from "./SISTest.svelte";

ScheduleTester;

export const testRoutes = {
  "/test/schedule": {
    page: ScheduleTester,
    title: "Schedule Structure Tester",
  },
  "/test/": {
    page: TestMenu,
    title: "Test Menu",
  },
  "/test/sis": {
    page: SisTest,
    title: "SIS API Test Tool",
  },
};
