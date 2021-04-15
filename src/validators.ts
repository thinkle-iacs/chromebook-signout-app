import { writable, get } from "svelte/store";
import { tick } from "svelte";
import { searchForStudent, getStudent } from "./students";
import { searchForAsset, assetStore } from "./inventory";

const cachedValidations = {
  assets: {},
  students: {},
};
let updateCount = 0;

export let studentDropdown = writable([]);
export let studentName = writable("");
export let assetTag = writable("");

export const validateStudent = async (s) => {
  studentDropdown.set([]);
  updateCount += 1;
  let myUpdateNumber = updateCount;
  if (cachedValidations.students[s]) {
    return cachedValidations.students[s];
  }
  await tick();
  await sleep(500);
  if (!s || updateCount != myUpdateNumber) {
    return {
      name: "still typing nevermind",
      valid: true,
    };
  } else {
    let valid = false;
    let results = await searchForStudent(s);
    if (results.length > 0) {
      valid = true;
    }
    let result = {
      name: "Student not found",
      valid,
    };
    cachedValidations[s] = result;
    if (results.length == 1) {
      let name = results[0].fields.Name;
      studentName.set(name);
      cachedValidations.students[name] = result;
    } else if (results.length < 20) {
      studentDropdown.set(results.map((result) => result.fields.Name));
    }
    return result;
  }
};

export const validateAsset = async (s) => {
  if (s && s.length > 3) {
    let $assetStore = get(assetStore);
    if ($assetStore[s]) {
      return {
        name: "Asset found",
        valid: true,
      };
    }
    if (cachedValidations.assets[s]) {
      return cachedValidations.assets[s];
    }
    let valid = false;
    let results = await searchForAsset(s);
    if (results.length) {
      valid = true;
    }
    if (results.length == 1) {
      assetTag.set(results[0].fields["Asset Tag"]);
    }
    return {
      name: "Asset not found",
      valid,
    };
  } else {
    return {
      name: "",
      valid: true,
    };
  }
};

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(true), ms);
  });
}
