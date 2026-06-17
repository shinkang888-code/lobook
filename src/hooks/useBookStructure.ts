"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BookStructure, SaveStructureInput } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청 실패");
  return data as T;
}

export function useBookStructure(bookId: string) {
  return useQuery({
    queryKey: ["books", bookId, "structure"],
    queryFn: () =>
      fetchJson<{ structure: BookStructure }>(`/api/books/${bookId}/structure`).then(
        (d) => d.structure,
      ),
    enabled: Boolean(bookId),
  });
}

export function useSaveBookStructure(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveStructureInput) =>
      fetchJson<{ structure: BookStructure }>(`/api/books/${bookId}/structure`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((d) => d.structure),
    onSuccess: (structure) => {
      queryClient.setQueryData(["books", bookId, "structure"], structure);
      queryClient.setQueryData(["books", bookId], structure.book);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useAddChapter(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) =>
      fetchJson<{ chapter: BookStructure["chapters"][0] }>(`/api/books/${bookId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).then((d) => d.chapter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", bookId, "structure"] });
    },
  });
}
