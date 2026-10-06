"use client";

import { useEffect, useRef, useState } from "react";
import { PROBLEM_CATEGORIES } from "@/lib/constants";
import {
  EMPTY_FACETS,
  hasActiveFacets,
  type ProblemFacets,
  type ProblemSort,
} from "@/components/dashboard/problems/catalogue";
import type { ProblemPage } from "@/lib/problem-list";

/** Typing pauses this long before the list is refetched. */
const SEARCH_DEBOUNCE_MS = 250;

function listUrl(facets: ProblemFacets, sort: ProblemSort, offset: number): string {
  const params = new URLSearchParams({
    search: facets.search.trim(),
    difficulty: facets.difficulty,
    category: facets.category,
    progress: facets.progress,
    freeOnly: String(facets.freeOnly),
    company: facets.company,
    sort,
    offset: String(offset),
  });
  return `/api/problems/list?${params}`;
}

/**
 * Facet state plus server-side paging for a problem list. The server renders
 * the first page; filters refetch page one and scrolling appends the next, so
 * the browser never holds the whole bank. Shared by /problems and /practice.
 */
export function useProblemFilters(initial: ProblemPage) {
  const [facets, setFacets] = useState<ProblemFacets>(EMPTY_FACETS);
  const [sort, setSort] = useState<ProblemSort>("default");
  const [page, setPage] = useState<ProblemPage>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  // The server already rendered the default query; only fetch once it changes.
  const lastQuery = useRef(listUrl(EMPTY_FACETS, "default", 0));

  async function load(offset: number) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(listUrl(facets, sort, offset), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = (await response.json()) as ProblemPage;
      setPage((previous) =>
        offset === 0 ? next : { ...next, items: [...previous.items, ...next.items] }
      );
    } catch (caught) {
      if ((caught as Error).name !== "AbortError") setError(true);
    } finally {
      if (requestRef.current === controller) setLoading(false);
    }
  }

  // Any facet or sort change reloads page one; typing is debounced.
  useEffect(() => {
    const query = listUrl(facets, sort, 0);
    if (query === lastQuery.current) return;
    const timer = setTimeout(() => {
      lastQuery.current = query;
      void load(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load reads the latest facets/sort
  }, [facets, sort]);

  const hasMore = page.items.length < page.total;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void load(page.items.length);
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm after each page lands
  }, [hasMore, loading, error, page.items.length]);

  function update<K extends keyof ProblemFacets>(key: K, value: ProblemFacets[K]) {
    setFacets((previous) => ({ ...previous, [key]: value }));
  }

  function clear() {
    setFacets(EMPTY_FACETS);
    setSort("default");
  }

  return {
    facets,
    sort,
    setSort,
    update,
    clear,
    categories: PROBLEM_CATEGORIES as readonly string[],
    counts: page.counts,
    visible: page.items,
    total: page.total,
    bankTotal: page.bankTotal,
    hasMore,
    loading,
    error,
    sentinelRef,
    loadMore: () => void load(page.items.length),
    isFiltered: hasActiveFacets(facets) || sort !== "default",
  };
}

export type ProblemFilters = ReturnType<typeof useProblemFilters>;
