import UserActivity from '../models/UserActivity';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Record activity for a user on the given date (default: today). Upserts and increments count.
 */
export async function recordActivity(userId: string, date?: Date): Promise<void> {
  const dateStr = date ? toDateString(date) : toDateString(new Date());
  await UserActivity.findOneAndUpdate(
    { user: userId, date: dateStr },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );
}

/**
 * Get activity for the last 365 days and compute current streak (LeetCode-style).
 */
export async function getActivityForUser(userId: string): Promise<{
  streak: number;
  lastActiveDate: string | null;
  days: Array<{ date: string; count: number }>;
}> {
  const today = toDateString(new Date());
  const start = new Date();
  start.setDate(start.getDate() - 364);
  const startStr = toDateString(start);

  const docs = await UserActivity.find({
    user: userId,
    date: { $gte: startStr, $lte: today },
  })
    .sort({ date: 1 })
    .lean();

  const dayMap = new Map<string, number>();
  for (const d of docs) {
    dayMap.set(d.date, d.count);
  }

  const days: Array<{ date: string; count: number }> = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = toDateString(d);
    days.push({ date: dateStr, count: dayMap.get(dateStr) ?? 0 });
  }

  let lastActiveDate: string | null = null;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      lastActiveDate = days[i].date;
      break;
    }
  }

  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = toDateString(check);
    if ((dayMap.get(dateStr) ?? 0) > 0) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return { streak, lastActiveDate, days };
}
