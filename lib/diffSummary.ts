export type FileSummary = {
  path: string;
  additions: number;
  deletions: number;
  keys: string[];
};

const DIFF_HEADER = /^diff --git a\/(.+?) b\/(.+)$/;
const JSON_KEY = /^"([^"]+)"\s*:/;
const YAML_KEY = /^([A-Za-z0-9_.-]+)\s*:/;

function isStructured(path: string) {
  return path.endsWith(".json") || path.endsWith(".yml") || path.endsWith(".yaml");
}

export function summarizeDiff(diff: string): FileSummary[] {
  const lines = diff.split(/\r?\n/);
  const summaries = new Map<string, FileSummary>();
  let currentPath: string | null = null;

  for (const line of lines) {
    const headerMatch = DIFF_HEADER.exec(line);
    if (headerMatch) {
      currentPath = headerMatch[2];
      if (!summaries.has(currentPath)) {
        summaries.set(currentPath, {
          path: currentPath,
          additions: 0,
          deletions: 0,
          keys: []
        });
      }
      continue;
    }

    if (!currentPath) {
      continue;
    }

    if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("@@")) {
      continue;
    }

    if (line.startsWith("+")) {
      const summary = summaries.get(currentPath);
      if (summary) {
        summary.additions += 1;
        captureKey(summary, currentPath, line.slice(1));
      }
      continue;
    }

    if (line.startsWith("-")) {
      const summary = summaries.get(currentPath);
      if (summary) {
        summary.deletions += 1;
        captureKey(summary, currentPath, line.slice(1));
      }
    }
  }

  return Array.from(summaries.values()).map((summary) => {
    summary.keys = Array.from(new Set(summary.keys));
    return summary;
  });
}

function captureKey(summary: FileSummary, path: string, rawLine: string) {
  if (!isStructured(path)) {
    return;
  }

  const trimmed = rawLine.trim();
  const jsonMatch = JSON_KEY.exec(trimmed);
  if (jsonMatch) {
    summary.keys.push(jsonMatch[1]);
    return;
  }

  const yamlMatch = YAML_KEY.exec(trimmed);
  if (yamlMatch) {
    summary.keys.push(yamlMatch[1]);
  }
}

export function formatSummary(summaries: FileSummary[]): string {
  if (summaries.length === 0) {
    return "No file headers found. Paste a full git diff starting with 'diff --git'.";
  }

  return summaries
    .map((summary) => {
      const changedLines = summary.additions + summary.deletions;
      if (summary.keys.length > 0) {
        const keys = summary.keys.slice(0, 12).join(", ");
        const suffix = summary.keys.length > 12 ? "…" : "";
        return `${summary.path}: +${summary.additions} -${summary.deletions}. Keys changed: ${keys}${suffix}`;
      }
      return `${summary.path}: Changed ${changedLines} lines (+${summary.additions} -${summary.deletions}).`;
    })
    .join("\n");
}
