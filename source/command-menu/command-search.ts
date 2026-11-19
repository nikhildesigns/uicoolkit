import type { ReactNode } from "react";

export type CommandItem = {
  id: string;
  label: string;
  keywords?: string[];
  icon?: ReactNode;
  onSelect: () => void;
};
export type CommandGroup = { id: string; label: string; items: CommandItem[] };
export type CommandFilter = (query: string, item: CommandItem) => number;

function scoreText(query: string, text: string) {
  const candidate = text.toLowerCase();
  if (candidate === query) return 4;
  if (candidate.startsWith(query)) return 3;
  if (candidate.includes(query)) return 2;
  let cursor = 0;
  for (const char of query.replace(/\s+/g, "")) {
    const index = candidate.indexOf(char, cursor);
    if (index < 0) return 0;
    cursor = index + 1;
  }
  return 1;
}

const defaultFilter: CommandFilter = (query, item) => {
  const normalized = query.toLowerCase();
  const labelScore = scoreText(normalized, item.label);
  const keywordScores = (item.keywords ?? []).map(word => scoreText(normalized, word) * 0.9);
  return Math.max(labelScore, ...keywordScores);
};

export function searchCommands(groups: CommandGroup[], query: string, filter = defaultFilter): CommandGroup[] {
  const term = query.trim();
  if (!term) return groups.filter(group => group.items.length > 0);
  return groups.map(group => {
    const ranked = group.items.map(item => ({ item, score: filter(term, item) }))
      .filter(hit => hit.score > 0).sort((a, b) => b.score - a.score);
    return { group, ranked };
  }).filter(hit => hit.ranked.length > 0)
    .sort((a, b) => b.ranked[0].score - a.ranked[0].score)
    .map(({ group, ranked }) => ({ ...group, items: ranked.map(hit => hit.item) }));
}
