import type { Pin } from "@pinboard/shared";
import { api } from "../../api/client";

export async function fetchFeed(q?: string) {
  const { data } = await api.get<{ pins: Pin[] }>("/pins", { params: q ? { q } : undefined });
  return data.pins;
}

export async function fetchPin(id: string) {
  const { data } = await api.get<{ pin: Pin }>(`/pins/${id}`);
  return data.pin;
}

export async function createPin(form: FormData) {
  const { data } = await api.post<{ pin: Pin }>("/pins", form);
  return data.pin;
}

export async function updatePin(id: string, payload: { title?: string; description?: string; tags?: string[] }) {
  const { data } = await api.patch<{ pin: Pin }>(`/pins/${id}`, payload);
  return data.pin;
}

export async function deletePin(id: string) {
  await api.delete(`/pins/${id}`);
}

export async function downloadPin(id: string) {
  const response = await api.get(`/pins/${id}/download`, { responseType: "blob" });
  const contentType = response.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    const text = await (response.data as Blob).text();
    const parsed = JSON.parse(text) as { url: string };
    window.open(parsed.url, "_blank");
    return;
  }
  const url = URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pin-download";
  link.click();
  URL.revokeObjectURL(url);
}
