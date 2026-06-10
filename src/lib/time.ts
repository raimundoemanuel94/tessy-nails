export const BOOKING_TIME_ZONE =
  process.env.NEXT_PUBLIC_BOOKING_TIME_ZONE ??
  process.env.BOOKING_TIME_ZONE ??
  "America/Cuiaba";

type ZonedDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

const OFFSET_RE = /(Z|[+-]\d{2}:?\d{2})$/;
const LOCAL_DATE_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function getZonedParts(date: Date, timeZone = BOOKING_TIME_ZONE): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    millisecond: date.getUTCMilliseconds(),
  };
}

export function zonedDateString(date: Date, timeZone = BOOKING_TIME_ZONE): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function zonedTimeString(date: Date, timeZone = BOOKING_TIME_ZONE): string {
  const parts = getZonedParts(date, timeZone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
  millisecond = 0,
  timeZone = BOOKING_TIME_ZONE,
): Date {
  const target = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let guess = new Date(target);

  for (let i = 0; i < 4; i += 1) {
    const zoned = getZonedParts(guess, timeZone);
    const zonedUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      zoned.millisecond,
    );
    const diff = target - zonedUtc;
    if (diff === 0) break;
    guess = new Date(guess.getTime() + diff);
  }

  return guess;
}

export function localDateTimeToUtc(dateTime: string, timeZone = BOOKING_TIME_ZONE): Date {
  if (OFFSET_RE.test(dateTime)) return new Date(dateTime);

  const match = LOCAL_DATE_RE.exec(dateTime);
  if (!match) return new Date(dateTime);

  const [, y, m, d, hh = "0", mm = "0", ss = "0", ms = "0"] = match;
  return zonedDateTimeToUtc(
    Number(y),
    Number(m),
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
    Number(ms.padEnd(3, "0")),
    timeZone,
  );
}

export function zonedDayRange(dateYmd: string, timeZone = BOOKING_TIME_ZONE): { start: Date; end: Date } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd);
  if (!match) {
    const invalid = new Date(NaN);
    return { start: invalid, end: invalid };
  }

  const [, y, m, d] = match;
  return {
    start: zonedDateTimeToUtc(Number(y), Number(m), Number(d), 0, 0, 0, 0, timeZone),
    end: zonedDateTimeToUtc(Number(y), Number(m), Number(d), 23, 59, 59, 999, timeZone),
  };
}

export function currentZonedDayRange(date: Date, timeZone = BOOKING_TIME_ZONE): { start: Date; end: Date } {
  return zonedDayRange(zonedDateString(date, timeZone), timeZone);
}

export function isSameZonedDate(left: Date, right: Date, timeZone = BOOKING_TIME_ZONE): boolean {
  return zonedDateString(left, timeZone) === zonedDateString(right, timeZone);
}

export function zonedMinutes(date: Date, timeZone = BOOKING_TIME_ZONE): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

export function zonedWeekdayKey(date: Date, timeZone = BOOKING_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();
}
