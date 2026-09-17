const CLAUDE_MEMORY_KEY = 'mb_sent_to_claude_names';

export const getSentToClaudeNames = (): string[] => {
  try {
    const raw = localStorage.getItem(CLAUDE_MEMORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addSentToClaudeNames = (names: string[]): string[] => {
  try {
    const current = getSentToClaudeNames();
    const cleanNames = names.filter(Boolean).map(n => n.trim());
    const updated = Array.from(new Set([...current, ...cleanNames]));
    localStorage.setItem(CLAUDE_MEMORY_KEY, JSON.stringify(updated));
    setTimeout(() => {
      window.dispatchEvent(new Event('claudeMemoryUpdated'));
    }, 0);
    return updated;
  } catch {
    return [];
  }
};

export const removeSentToClaudeName = (nameToRemove: string): string[] => {
  try {
    const current = getSentToClaudeNames();
    const updated = current.filter(n => n.toLowerCase() !== nameToRemove.toLowerCase());
    localStorage.setItem(CLAUDE_MEMORY_KEY, JSON.stringify(updated));
    setTimeout(() => {
      window.dispatchEvent(new Event('claudeMemoryUpdated'));
    }, 0);
    return updated;
  } catch {
    return [];
  }
};

export const clearSentToClaudeMemory = (): void => {
  try {
    localStorage.removeItem(CLAUDE_MEMORY_KEY);
    setTimeout(() => {
      window.dispatchEvent(new Event('claudeMemoryUpdated'));
    }, 0);
  } catch {}
};
