/**
 * Jalali (Persian/Shamsi) Calendar Conversion and Utilities
 */

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const WEEKDAY_NAMES_FA = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export function toPersianDigits(strNum: string | number): string {
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(strNum).replace(/\d/g, (x) => pDigits[parseInt(x, 10)]);
}

export function toEnglishDigits(strNum: string): string {
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let res = strNum;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(pDigits[i], 'g'), String(i));
  }
  return res;
}

export function isJalaliLeapYear(jy: number): boolean {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[breaks.length - 1]) return false;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let N = jy - jp;
  if (jump - N < 6) N = N - jump + (Math.floor((jump + 4) / 33) * 33);
  let leap = ((((N + 1) % 33) - 1) % 4);
  if (leap === -1) leap = 4;
  return leap === 0;
}

export function getJalaliDaysInMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy2 = jy + 1595;
  let days = -355668 + (365 * jy2) + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { gy, gm, gd };
}

export function parseDateToJalali(dateInput: Date | string): { jy: number; jm: number; jd: number; dayOfWeekIndex: number } {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const gy = validDate.getFullYear();
  const gm = validDate.getMonth() + 1;
  const gd = validDate.getDate();
  const j = gregorianToJalali(gy, gm, gd);
  
  // Saturday = 0 in Iranian week (JS Sunday is 0)
  const jsDay = validDate.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
  const dayOfWeekIndex = (jsDay + 1) % 7; // Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
  return { ...j, dayOfWeekIndex };
}

export function formatJalaliShort(dateInput: Date | string): string {
  const { jy, jm, jd } = parseDateToJalali(dateInput);
  const mm = jm < 10 ? `0${jm}` : `${jm}`;
  const dd = jd < 10 ? `0${jd}` : `${jd}`;
  return toPersianDigits(`${jy}/${mm}/${dd}`);
}

export function formatJalaliFull(dateInput: Date | string): string {
  const { jy, jm, jd, dayOfWeekIndex } = parseDateToJalali(dateInput);
  const weekday = WEEKDAY_NAMES_FA[dayOfWeekIndex];
  const monthName = JALALI_MONTH_NAMES[jm - 1];
  return `${weekday} ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

export function getJalaliWeekdayName(dateInput: Date | string): string {
  const { dayOfWeekIndex } = parseDateToJalali(dateInput);
  return WEEKDAY_NAMES_FA[dayOfWeekIndex];
}

export function getStartOfWeekJalali(dateInput: Date | string): Date {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  const jsDay = d.getDay();
  const daysSinceSaturday = (jsDay + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function getWeekDaysJalali(startDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate.getTime());
  for (let i = 0; i < 7; i++) {
    const cur = new Date(start.getTime());
    cur.setDate(start.getDate() + i);
    days.push(cur);
  }
  return days;
}

export function formatISODateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
