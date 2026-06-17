"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Book, CreateBookInput, UpdateBookInput } from "@/lib/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청 실패");
  return data as T;
}

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: () => fetchJson<{ books: Book[] }>("/api/books").then((d) => d.books),
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ["books", id],
    queryFn: () => fetchJson<{ book: Book }>(`/api/books/${id}`).then((d) => d.book),
    enabled: Boolean(id),
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookInput) =>
      fetchJson<{ book: Book }>("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((d) => d.book),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useUpdateBook(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBookInput) =>
      fetchJson<{ book: Book }>(`/api/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }).then((d) => d.book),
    onSuccess: (book) => {
      queryClient.setQueryData(["books", id], book);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/books/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });
}
