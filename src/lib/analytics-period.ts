import { endOfDay, startOfDay, subDays } from "date-fns";

export type AnalyticsInterval = {
  start: Date;
  end: Date;
};

export const ANALYTICS_WINDOW_DAYS = 30;
const WINDOW_OFFSET_DAYS = ANALYTICS_WINDOW_DAYS - 1;

export function getLast30DaysInterval(baseDate: Date = new Date()): AnalyticsInterval {
  return {
    start: startOfDay(subDays(baseDate, WINDOW_OFFSET_DAYS)),
    end: endOfDay(baseDate),
  };
}

export function getPrevious30DaysInterval(baseDate: Date = new Date()): AnalyticsInterval {
  return {
    start: startOfDay(subDays(baseDate, WINDOW_OFFSET_DAYS + ANALYTICS_WINDOW_DAYS)),
    end: endOfDay(subDays(baseDate, ANALYTICS_WINDOW_DAYS)),
  };
}
