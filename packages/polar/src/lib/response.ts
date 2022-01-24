
export function getLogs (
  response: any // eslint-disable-line  @typescript-eslint/no-explicit-any
): Record<string, string|string[]> {
  const logs: Record<string, string|string[]> = {};
  for (const log of response.logs[0].events[1].attributes) {
    if (log.key in logs) {
      const presentVal = logs[log.key];
      let newVal: string[] = [];
      if (Array.isArray(presentVal)) {
        newVal = presentVal;
        newVal.push(log.value);
      } else {
        newVal.push(presentVal);
        newVal.push(log.val);
      }
      logs[log.key] = newVal;
    } else {
      logs[log.key] = log.value;
    }
  }
  return logs;
}
