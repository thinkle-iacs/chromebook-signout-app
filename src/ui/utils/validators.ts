import { writable, get } from "svelte/store";
import { tick } from "svelte";
import { searchForStudent } from "@data/students";
import { searchForStaff } from "@data/staff";
import { searchForAsset, assetStore } from "@data/inventory";

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
export const validateStudent = async (
  s,
  studentNameStore = studentName,
  studentDropdownStore = studentDropdown
) => {
  console.log("Validate student", s);
  studentDropdownStore.set([]);
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
        studentNameStore.set(name);
      }
      return {
        valid: true,
        name: "Matching student",
      };
    } else if (results.length < 20) {
      studentDropdownStore.set(
        results
          .slice()
          .sort((a, b) => {
            // Sort by Status first
            const statusA = a.fields.Status || "";
            const statusB = b.fields.Status || "";
            if (statusA < statusB) return -1;
            if (statusA > statusB) return 1;
            // Then by Name
            const nameA = a.fields.Name || "";
            const nameB = b.fields.Name || "";
            return nameA.localeCompare(nameB);
          })
          .map((result) => ({
            name: result.fields.Name,
            ...result.fields,
          }))
      );
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
export const validateStaff = async (
  s,
  staffNameStore = staffName,
  staffDropdownStore = staffDropdown
) => {
  console.log("Validate staff", s);
  staffDropdownStore.set([]);
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
      staffDropdownStore.set(
        results.map((r) => ({
          name: r["Full Name"],
          ...r,
        }))
      );
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

export const validateAssets = async (
  assets: string[],
  assetTagStore = assetTag,
  assetTagsStore = assetTags
) => {
  let aggregateResult = { name: "Asset found", valid: true };
  let errors = [];
  for (let asset of assets) {
    if (asset.toUpperCase) {
      asset = asset.toUpperCase();
    }
    let result = await validateAsset(asset);
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
  s
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
