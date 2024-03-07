import { writable, get } from "svelte/store";
import { tick } from "svelte";
import { searchForStudent } from "./data/students";
import { searchForStaff } from "./data/staff";
import { searchForAsset, assetStore } from "./data/inventory";

const cachedValidations = {
  assets: {},
  students: {},
  staff: {},
};

export let staffDropdown = writable([]);
export let studentDropdown = writable([]);
export let staffName = writable("");
export let studentName = writable("");
export let assetTag = writable("");
export let assetTags = writable([]);
export let chargerTag = writable("");

function toTitleCase(s: string) {
  if (s) {
    s = s[0].toUpperCase() + s.substring(1);
    let commaAt = s.indexOf(", ");
    if (commaAt > -1 && commaAt < s.length - 2) {
      console.log("Got comma", commaAt, s);
      s =
        s.substring(0, commaAt + 2) +
        s[commaAt + 2].toUpperCase() +
        s.substring(commaAt + 3);
    }
    return s;
  } else {
    return "";
  }
}

/* studentName.subscribe((s) => {
  if (s) {
    studentName.update((s) => toTitleCase(s));
  }
});

staffName.subscribe((s) => {
  if (s) {
    staffName.update((s) => toTitleCase(s));
  }
});
 */
assetTag.subscribe((s) => {
  console.log("Asset Tag change!", s);
  if (s.toUpperCase) {
    let value = s.toUpperCase();
    console.log("Upper", value);
    return value;
  } else {
    console.log("Unchanged", s);
    return s;
  }
});

assetTags.subscribe((ss) =>
  ss.map((s) => (s.toUpperCase() && s.toUpperCase()) || s)
);

let studentUpdateCount = 0;
export const validateStudent = async (s) => {
  console.log("Validate student", s);
  studentDropdown.set([]);
  studentUpdateCount += 1;
  let myUpdateNumber = studentUpdateCount;
  if (cachedValidations.students[s]) {
    return cachedValidations.students[s];
  }
  await tick();
  await sleep(500);
  if (!s || studentUpdateCount != myUpdateNumber) {
    return {
      name: "still typing nevermind",
      valid: true,
    };
  } else {
    let valid = false;
    let results = await searchForStudent(s);
    if (results.length == 0) {
      return {
        valid: false,
        name: "No matching student",
      };
    } else if (results.length == 1) {
      valid = true;
      let name = results[0].fields.Name;
      if (name != s) {
        studentName.set(name);
      }
      return {
        valid: true,
        name: "Matching student",
      };
    } else if (results.length < 20) {
      studentDropdown.set(results.map((result) => result.fields.Name));
      return {
        valid: false,
        name: "Choose matching student",
      };
    } else {
      return {
        valid: false,
        name: `${results.length} students found, keep typing...`,
      };
    }
  }
};
let staffUpdateCount = 0;
export const validateStaff = async (s) => {
  console.log("Validate staff", s);
  staffDropdown.set([]);
  staffUpdateCount += 1;
  let myUpdateNumber = staffUpdateCount;
  if (cachedValidations.staff[s]) {
    return cachedValidations.staff[s];
  }
  await tick();
  await sleep(500);
  if (!s || staffUpdateCount != myUpdateNumber) {
    return {
      name: "still typing",
      valid: true,
    };
  } else {
    let valid = false;
    let results = await searchForStaff(s);
    if (results.length == 0) {
      return {
        valid: false,
        name: "No matching staff member",
      };
    } else if (results.length == 1) {
      valid = true;
      let name = results[0]["Full Name"];
      if (name != s) {
        staffName.set(name);
      }
      return {
        valid: true,
        name: "Matching staff member",
      };
    } else if (results.length < 20) {
      staffDropdown.set(results.map((r) => r["Full Name"]));
      return {
        valid: false,
        name: "Find matching staff member",
      };
    } else {
      return {
        valid: false,
        name: `${results.length} matches found, keep typing :)`,
      };
    }
  }
};

export const validateAssets = async (assets: string[], isCharger = false) => {
  let aggregateResult = { name: "Asset found", valid: true };
  let errors = [];
  for (let asset of assets) {
    if (asset.toUpperCase) {
      asset = asset.toUpperCase();
    }
    let result = await validateAsset(asset, isCharger);
    if (!result.valid) {
      errors.push(result);
    }
  }
  if (errors.length > 0) {
    return {
      valid: false,
      name: errors.map((e) => !e.valid && e.name).join(", "),
    };
  } else {
    return {
      valid: true,
      name: "Asset found",
    };
  }
};

export const validateAsset = async (
  s,
  isCharger = false
): Promise<{ name: string; valid: boolean }> => {
  console.log("Validate asset", s);
  if (s && s.length >= 3) {
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
      if (isCharger) {
        chargerTag.set(results[0].fields["Asset Tag"]);
      } else {
        assetTag.set(results[0].fields["Asset Tag"]);
      }
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
