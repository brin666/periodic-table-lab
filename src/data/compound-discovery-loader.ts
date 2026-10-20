type CompoundDiscoveryData = typeof import("./compound-discovery");

let loadedData: CompoundDiscoveryData | null = null;
let pendingLoad: Promise<CompoundDiscoveryData> | null = null;

export function getLoadedCompoundDiscovery() {
  return loadedData;
}

/** The empty workbench needs no compound index; start loading after selection. */
export function loadCompoundDiscovery(): Promise<CompoundDiscoveryData> {
  if (loadedData) return Promise.resolve(loadedData);
  if (!pendingLoad) {
    pendingLoad = import("./compound-discovery").then(
      (data) => {
        loadedData = data;
        return data;
      },
      (error: unknown) => {
        pendingLoad = null;
        throw error;
      },
    );
  }
  return pendingLoad;
}
