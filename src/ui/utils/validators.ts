import { writable, get, type Writable } from "svelte/store";
import { logger } from "@utils/log";
import { searchForStudent, peekStudentSearch } from "@data/students";
import { searchForStaff, peekStaffSearch, type Staff } from "@data/staff";
import { searchForAsset, assetStore } from "@data/inventory";

const cachedValidations = {
  assets: {},
};

export let staffDropdown = writable([]);
export let studentDropdown = writable([]);
export let staffName = writable("");
export let studentName = writable("");
export let assetTag = writable("");
export let assetTags = writable([]);

assetTag.subscribe((s) => {
  logger.logVerbose("Asset Tag change!", s);
  if (s.toUpperCase) {
    let value = s.toUpperCase();
    logger.logVerbose("Upper", value);
    return value;
  } else {
    logger.logVerbose("Unchanged", s);
    return s;
  }
});

assetTags.subscribe((ss) =>
  ss.map((s) => (s.toUpperCase() && s.toUpperCase()) || s)
);

type ValidationResult = { name: string; valid: boolean };

// How long to wait after a keystroke before hitting the server, or before
// auto-filling a single match (so we don't rewrite the input mid-word).
const TYPING_DEBOUNCE_MS = 300;
// Max rows shown in the autocomplete dropdown.
const MAX_DROPDOWN = 20;

/**
 * Builds a name validator that also drives the autocomplete dropdown.
 *
 * - Answers instantly from the local search cache when it can.
 * - Only the most recent call for a given validator touches the stores;
 *   superseded calls resolve with the latest call's result, so a slow stale
 *   response can never overwrite newer results (svelte-forms applies async
 *   results in whatever order they resolve).
 */
function createNameValidator<T>({
  label,
  peek,
  search,
  getName,
  toDropdownItem,
  sort,
  defaultNameStore,
  defaultDropdownStore,
}: {
  label: string;
  peek: (s: string) => T[] | null;
  search: (s: string) => Promise<T[]>;
  getName: (item: T) => string;
  toDropdownItem: (item: T) => any;
  sort?: (a: T, b: T) => number;
  defaultNameStore: Writable<string>;
  defaultDropdownStore: Writable<any[]>;
}) {
  let updateCount = 0;
  let latest: Promise<ValidationResult> = Promise.resolve({
    name: "",
    valid: true,
  });

  async function run(
    s: string,
    myUpdateNumber: number,
    nameStore: Writable<string>,
    dropdownStore: Writable<any[]>
  ): Promise<ValidationResult> {
    const isStale = () => updateCount != myUpdateNumber;
    // Superseded: defer to whatever the newest call decides.
    const stale = () => latest;

    if (!s) {
      dropdownStore.set([]);
      return { name: "", valid: true };
    }

    const showDropdown = (results: T[]) => {
      let items = results.slice();
      if (sort) items.sort(sort);
      dropdownStore.set(items.slice(0, MAX_DROPDOWN).map(toDropdownItem));
    };

    let results = peek(s);
    if (results) {
      // Instant feedback from cache.
      showDropdown(results);
    }
    const lower = s.toLowerCase();
    const exact = results?.find((r) => (getName(r) || "").toLowerCase() == lower);
    const needsWait = !results || (!exact && results.length == 1);
    if (needsWait) {
      await sleep(TYPING_DEBOUNCE_MS);
      if (isStale()) return stale();
    }
    if (!results) {
      try {
        results = await search(s);
      } catch (err) {
        logger.logError(`${label} search failed`, err);
        if (isStale()) return stale();
        return { valid: false, name: `Could not look up ${label}` };
      }
      if (isStale()) return stale();
    }

    const exactMatch = results.find(
      (r) => (getName(r) || "").toLowerCase() == lower
    );
    if (exactMatch) {
      // Covers picking "Smith, John" when "Smith, Johnny" also exists.
      dropdownStore.set([]);
      const name = getName(exactMatch);
      if (name != s) nameStore.set(name);
      return { valid: true, name: `Matching ${label}` };
    }
    if (results.length == 0) {
      dropdownStore.set([]);
      return { valid: false, name: `No matching ${label}` };
    }
    if (results.length == 1) {
      dropdownStore.set([]);
      nameStore.set(getName(results[0]));
      return { valid: true, name: `Matching ${label}` };
    }
    showDropdown(results);
    if (results.length <= MAX_DROPDOWN) {
      return { valid: false, name: `Choose matching ${label}` };
    }
    return {
      valid: false,
      name: `${results.length}${results.length >= 100 ? "+" : ""} matches found, keep typing...`,
    };
  }

  return (
    s: string,
    nameStore: Writable<string> = defaultNameStore,
    dropdownStore: Writable<any[]> = defaultDropdownStore
  ): Promise<ValidationResult> => {
    logger.logVerbose(`Validate ${label}`, s);
    updateCount += 1;
    const promise = run(s, updateCount, nameStore, dropdownStore);
    latest = promise;
    return promise;
  };
}

export const validateStudent = createNameValidator<any>({
  label: "student",
  peek: peekStudentSearch,
  search: searchForStudent,
  getName: (result) => result.fields.Name,
  toDropdownItem: (result) => ({ name: result.fields.Name, ...result.fields }),
  sort: (a, b) => {
    // Sort by Status first (Active before Inactive), then by Name
    const statusA = a.fields.Status || "";
    const statusB = b.fields.Status || "";
    if (statusA < statusB) return -1;
    if (statusA > statusB) return 1;
    return (a.fields.Name || "").localeCompare(b.fields.Name || "");
  },
  defaultNameStore: studentName,
  defaultDropdownStore: studentDropdown,
});

export const validateStaff = createNameValidator<Staff>({
  label: "staff member",
  peek: peekStaffSearch,
  search: searchForStaff,
  getName: (staff) => staff["Full Name"],
  toDropdownItem: (staff) => ({ name: staff["Full Name"], ...staff }),
  defaultNameStore: staffName,
  defaultDropdownStore: staffDropdown,
});

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
  logger.logVerbose("Validate asset", s);
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
    if (results.length === 0) {
      // Fallback: try serial number lookup (kids sometimes rip off asset tags)
      results = await searchForAsset(null, null, s.toLowerCase());
    }
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
