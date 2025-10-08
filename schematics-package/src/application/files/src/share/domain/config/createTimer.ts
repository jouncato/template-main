export type ProcessTime = {
  end: () => string;
};

export function createTimer(): ProcessTime {
  const startTime = process.hrtime();
  return {
    end: () => {
      const endTime = process.hrtime(startTime);
      const msTime = endTime[0] * 1000 + endTime[1] / 1000000; // milliseconds
      return `${msTime}ms`;
    },
  };
}
