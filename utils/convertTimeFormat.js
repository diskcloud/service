function convertTimeFormat(time, unit = "ms") {
  const timeUnits = [
    { unit: "y", ms: 365 * 24 * 60 * 60 * 1000 }, // 年
    { unit: "M", ms: 30 * 24 * 60 * 60 * 1000 }, // 月
    { unit: "w", ms: 7 * 24 * 60 * 60 * 1000 }, // 周
    { unit: "d", ms: 24 * 60 * 60 * 1000 }, // 天
    { unit: "h", ms: 60 * 60 * 1000 }, // 小时
    { unit: "m", ms: 60 * 1000 }, // 分钟
    { unit: "s", ms: 1000 }, // 秒
  ];

  if (typeof time === "string") {
    time = parseInt(time, 10);
    if (isNaN(time)) {
      throw new Error("Invalid input: unable to convert string to number.");
    }
  } else if (typeof time !== "number") {
    throw new Error(
      "Invalid input type: input should be a number or a numeric string."
    );
  }

  // 将秒转换为毫秒
  if (unit === "s") {
    time = time * 1000;
  }

  for (let i = 0; i < timeUnits.length; i++) {
    const { unit, ms } = timeUnits[i];
    if (time >= ms) {
      const value = Math.floor(time / ms);
      return `${value}${unit}`;
    }
  }

  return `${time}ms`; // For cases less than 1 second
}

module.exports = {
  convertTimeFormat,
};
