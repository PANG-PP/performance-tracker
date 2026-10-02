import { Category, WorkRecord } from "./types";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

type GasResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type InitialData = {
  records: WorkRecord[];
  categories: Category[];
};

async function gasGet<T>(action: string): Promise<T> {
  const baseUrl = env("GOOGLE_APPS_SCRIPT_URL");
  const secret = env("APPS_SCRIPT_SECRET");
  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("secret", secret);

  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
  const payload = (await response.json()) as GasResponse<T>;
  if (!payload.ok) throw new Error(payload.error || "Google Apps Script request failed");
  return payload.data as T;
}

async function gasPost<T>(action: string, data?: unknown): Promise<T> {
  const response = await fetch(env("GOOGLE_APPS_SCRIPT_URL"), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, secret: env("APPS_SCRIPT_SECRET"), data }),
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
  const payload = (await response.json()) as GasResponse<T>;
  if (!payload.ok) throw new Error(payload.error || "Google Apps Script request failed");
  return payload.data as T;
}

export async function getInitialData(): Promise<InitialData> {
  return gasGet<InitialData>("getInitialData");
}

export async function ensureDatabase() {
  await gasPost<{ ready: boolean }>("ensureDatabase");
}

export async function getRecords(): Promise<WorkRecord[]> {
  return gasGet<WorkRecord[]>("getRecords");
}

export async function appendRecord(record: WorkRecord): Promise<WorkRecord> {
  return gasPost<WorkRecord>("appendRecord", record);
}

export async function updateRecord(record: WorkRecord): Promise<WorkRecord> {
  return gasPost<WorkRecord>("updateRecord", record);
}

export async function deleteRecord(id: string) {
  await gasPost<{ deleted: boolean }>("deleteRecord", { id });
}

export async function getCategories(): Promise<Category[]> {
  return gasGet<Category[]>("getCategories");
}

export async function appendCategory(category: Category): Promise<Category> {
  return gasPost<Category>("appendCategory", category);
}

export async function updateCategory(category: Category): Promise<Category> {
  return gasPost<Category>("updateCategory", category);
}

export async function deleteCategory(id: string) {
  await gasPost<{ deleted: boolean }>("deleteCategory", { id });
}
