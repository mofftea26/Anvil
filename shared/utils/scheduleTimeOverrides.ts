import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "anvil_schedule_time_overrides_v1";
let cache: Record<string, string> | null = null;

async function load(): Promise<Record<string, string>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

async function persist(next: Record<string, string>): Promise<void> {
  cache = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort local persistence
  }
}

export async function getScheduleTimeOverrides(ids: string[]): Promise<Record<string, string>> {
  if (!ids.length) return {};
  const map = await load();
  const out: Record<string, string> = {};
  for (const id of ids) {
    if (map[id]) out[id] = map[id];
  }
  return out;
}

export async function setScheduleTimeOverride(assignmentId: string, time: string): Promise<void> {
  if (!assignmentId) return;
  const map = await load();
  const next = { ...map, [assignmentId]: time };
  await persist(next);
}

