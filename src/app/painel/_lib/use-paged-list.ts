"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "./api";

const SEARCH_DELAY_MS = 250;

/** A server-paginated list searched as the person types; `initial` is the server-rendered first page. */
export function usePagedList<T extends { page: number }>(
  path: string,
  initial: T,
) {
  const { toast } = useToast();
  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  // The term behind `data`: what the box holds may not have been searched yet.
  const [loadedSearch, setLoadedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const firstData = useRef(initial);
  const latest = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A reload can remove the row whose button held the focus; keep the keyboard inside the list.
  useEffect(() => {
    if (data !== firstData.current && document.activeElement === document.body)
      searchRef.current?.focus();
  }, [data]);

  async function load(term: string, page: number) {
    clearTimeout(timer.current);
    latest.current += 1;
    const request = latest.current;
    setLoading(true);
    const query = new URLSearchParams({ search: term, page: String(page) });
    const result = await apiFetch<T>(`${path}?${query}`);
    // A slower, older response must not overwrite what the person asked for last.
    if (request !== latest.current) return;
    setLoading(false);
    if (result.ok) {
      setData(result.data);
      setLoadedSearch(term);
      return;
    }
    toast({
      title: "Não foi possível carregar a lista",
      message: result.errors.error,
      tone: "danger",
    });
  }

  return {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch(term: string) {
      setSearch(term);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void load(term, 1), SEARCH_DELAY_MS);
    },
    goTo: (page: number) => load(search, page),
    reload: () => load(search, data.page),
  };
}
