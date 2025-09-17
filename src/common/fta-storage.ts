export function listFtaTasksInZone(zoneId: string) {
  const prefix = `fta-${zoneId}::`;
  const out: { taskId: string; storageKey: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(prefix)) {
      const taskId = k.substring(prefix.length);
      out.push({ taskId, storageKey: k });
    }
  }
  // 也可以在这里解析持久化内容，从中取出 topEvent 的标题做展示
  return out;
}

export function listAllFtaTasks() {
  const prefix = `fta-`;
  const out: { zoneId: string; taskId: string; storageKey: string }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;

    // 例如 fta-zoneA::task123
    if (k.startsWith(prefix)) {
      const rest = k.substring(prefix.length); // zoneA::task123
      const [zoneId, taskId] = rest.split('::');
      if (zoneId && taskId) {
        out.push({ zoneId, taskId, storageKey: k });
      }
    }
  }

  return out;
}

export function readTopTitle(storageKey: string): string | undefined {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw); // zustand persist 的结构
    const nodes = parsed?.state?.nodes ?? [];
    const top = nodes.find((n: any) => n.type === 'topEvent');
    return top?.data?.content;
  } catch {}
}

export function listAllFtaTasksWithTitles() {
  const raw = listAllFtaTasks();
  return raw.map(({ zoneId, taskId, storageKey }) => {
    try {
      const json = localStorage.getItem(storageKey);
      const parsed = json ? JSON.parse(json) : null;
      const nodes = parsed?.state?.nodes ?? [];
      const top = nodes.find((n: any) => n.type === 'topEvent');
      const title = top?.data?.content ?? '';
      return { zoneId, taskId, storageKey, title };
    } catch {
      return { zoneId, taskId, storageKey, title: '' };
    }
  });
}