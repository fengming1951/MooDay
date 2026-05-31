const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63,
];

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const LUNAR_DAYS = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

const SOLAR_TERM_NAMES = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
  '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至',
];

const DEG = Math.PI / 180;

function sunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const T2 = T * T;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T2;
  const Mr = M * DEG;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T2) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  let lon = lambda % 360;
  if (lon < 0) lon += 360;
  return lon;
}

function findSolarTermJD(year: number, termIndex: number): number {
  const targetLon = (285 + termIndex * 15) % 360;

  let jd = 2451545.0 + 365.2422 * (year - 2000) + 15.2184 * termIndex + 10;

  for (let iter = 0; iter < 5; iter++) {
    const lon = sunLongitude(jd);
    let diff = targetLon - lon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 0.0001) break;
    jd += diff * 1.015;
  }

  return jd;
}

function getYearLunarInfo(year: number) {
  return LUNAR_INFO[year - 1900] || LUNAR_INFO[0];
}

function leapMonth(year: number): number {
  return getYearLunarInfo(year) & 0xf;
}

function leapDays(year: number): number {
  if (leapMonth(year)) {
    return (getYearLunarInfo(year) & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(year: number, month: number): number {
  return (getYearLunarInfo(year) & (0x10000 >> month)) ? 30 : 29;
}

function lunarYearDays(year: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (getYearLunarInfo(year) & i) ? 1 : 0;
  }
  return sum + leapDays(year);
}

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
  yearName: string;
  monthName: string;
  dayName: string;
  zodiac: string;
  term: string | null;
}

const BASE_DATE = Date.UTC(1900, 0, 31);

function jdToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  let f = jd + 0.5 - z;
  let A: number;
  if (z < 2299161) {
    A = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    A = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E) + f;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const intDay = Math.floor(day);
  const fracDay = day - intDay;
  const hours = Math.floor(fracDay * 24);
  const minutes = Math.floor((fracDay * 24 - hours) * 60);
  const seconds = Math.floor(((fracDay * 24 - hours) * 60 - minutes) * 60);
  return new Date(Date.UTC(year, month - 1, intDay, hours, minutes, seconds));
}

const TERM_CACHE = new Map<string, Date[]>();

function getSolarTermsForYear(year: number): Date[] {
  const key = String(year);
  if (TERM_CACHE.has(key)) return TERM_CACHE.get(key)!;

  const terms: Date[] = [];
  for (let i = 0; i < 24; i++) {
    const jd = findSolarTermJD(year, i);
    terms.push(jdToDate(jd));
  }
  TERM_CACHE.set(key, terms);
  return terms;
}

function solarToLunar(y: number, m: number, d: number): LunarDate {
  let offset = Math.floor((Date.UTC(y, m, d) - BASE_DATE) / 86400000);

  let temp = 0;
  let lunarYear: number;
  for (lunarYear = 1900; lunarYear < 2100 && offset > 0; lunarYear++) {
    temp = lunarYearDays(lunarYear);
    if (offset < temp) break;
    offset -= temp;
  }

  const leap = leapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth: number;
  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    if (leap > 0 && lunarMonth === leap + 1 && !isLeap) {
      lunarMonth--;
      isLeap = true;
      temp = leapDays(lunarYear);
    } else {
      temp = monthDays(lunarYear, lunarMonth);
    }
    if (isLeap && lunarMonth === leap + 1) isLeap = false;
    if (offset < temp) break;
    offset -= temp;
  }

  const lunarDay = offset + 1;

  const yearIndex = (lunarYear - 4) % 60;
  const ganIndex = yearIndex % 10;
  const zhiIndex = yearIndex % 12;
  const yearName = GAN[ganIndex] + ZHI[zhiIndex];
  const zodiac = ANIMALS[zhiIndex];

  let monthName = (isLeap ? '闰' : '') + LUNAR_MONTHS[lunarMonth - 1] + '月';
  let dayName = LUNAR_DAYS[lunarDay];

  function toBeijingDate(utcDate: Date): { y: number; m: number; d: number } {
    const local = new Date(utcDate.getTime() + 8 * 3600000);
    return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
  }

  let term: string | null = null;
  const terms = getSolarTermsForYear(y);
  for (let i = 0; i < 24; i++) {
    const bj = toBeijingDate(terms[i]);
    if (bj.y === y && bj.m === m && bj.d === d) {
      term = SOLAR_TERM_NAMES[i];
      break;
    }
  }

  if (!term) {
    const nextTerms = getSolarTermsForYear(y + 1);
    for (let i = 0; i < 24; i++) {
      const bj = toBeijingDate(nextTerms[i]);
      if (bj.y === y && bj.m === m && bj.d === d) {
        term = SOLAR_TERM_NAMES[i];
        break;
      }
      if (bj.y > y) break;
    }
  }

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeap,
    yearName,
    monthName,
    dayName,
    zodiac,
    term,
  };
}

export function getLunarDate(date: Date): LunarDate {
  return solarToLunar(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatLunarDay(d: Date): string {
  const lunar = getLunarDate(d);
  if (lunar.term) return lunar.term;
  if (lunar.day === 1) return lunar.monthName;
  return lunar.dayName;
}
