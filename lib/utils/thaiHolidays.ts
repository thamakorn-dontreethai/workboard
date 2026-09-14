// Thailand Official Public & Bank Holidays Utility (Multi-Year & Automatic Calculations)

export interface ThaiHoliday {
  date: string; // "YYYY-MM-DD"
  nameTh: string;
  nameEn: string;
  isOfficial: boolean;
  type?: "national" | "royal" | "buddhist" | "substitute";
}

// Fixed-date annual public holidays in Thailand (MM-DD)
// These apply automatically to ALL years (2026, 2027, 2028, 2029, 2030+)
const FIXED_ANNUAL_HOLIDAYS: Record<string, { nameTh: string; nameEn: string; type: ThaiHoliday["type"] }> = {
  "01-01": { nameTh: "วันขึ้นปีใหม่", nameEn: "New Year's Day", type: "national" },
  "04-06": { nameTh: "วันจักรี", nameEn: "Chakri Memorial Day", type: "royal" },
  "04-13": { nameTh: "วันสงกรานต์", nameEn: "Songkran Festival Day 1", type: "national" },
  "04-14": { nameTh: "วันสงกรานต์ (วันครอบครัว)", nameEn: "Songkran Festival Day 2", type: "national" },
  "04-15": { nameTh: "วันสงกรานต์", nameEn: "Songkran Festival Day 3", type: "national" },
  "05-01": { nameTh: "วันแรงงานแห่งชาติ", nameEn: "National Labour Day", type: "national" },
  "05-04": { nameTh: "วันฉัตรมงคล", nameEn: "Coronation Day", type: "royal" },
  "06-03": { nameTh: "วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี", nameEn: "H.M. Queen Suthida's Birthday", type: "royal" },
  "07-28": { nameTh: "วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว (ร.10)", nameEn: "H.M. King Maha Vajiralongkorn's Birthday", type: "royal" },
  "08-12": { nameTh: "วันแม่แห่งชาติ / วันเฉลิมพระชนมพรรษาพระพันปีหลวง", nameEn: "Mother's Day / H.M. Queen Sirikit's Birthday", type: "royal" },
  "10-13": { nameTh: "วันนวมินทรมหาราช (ร.9)", nameEn: "King Bhumibol Adulyadej Memorial Day", type: "royal" },
  "10-23": { nameTh: "วันปิยมหาราช", nameEn: "Chulalongkorn Memorial Day", type: "royal" },
  "12-05": { nameTh: "วันพ่อแห่งชาติ / วันชาติ", nameEn: "Father's Day / National Day", type: "royal" },
  "12-10": { nameTh: "วันรัฐธรรมนูญ", nameEn: "Constitution Day", type: "national" },
  "12-31": { nameTh: "วันสิ้นปี", nameEn: "New Year's Eve", type: "national" },
};

// Variable lunar & special year-specific Buddhist and substitute holidays (YYYY-MM-DD)
const YEAR_SPECIFIC_HOLIDAYS: Record<string, { nameTh: string; nameEn: string; type: ThaiHoliday["type"] }> = {
  // ─── 2024 ───
  "2024-02-24": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2024-02-26": { nameTh: "วันหยุดชดเชยวันมาฆบูชา", nameEn: "Substitution for Makha Bucha Day", type: "substitute" },
  "2024-04-08": { nameTh: "วันหยุดชดเชยวันจักรี", nameEn: "Substitution for Chakri Memorial Day", type: "substitute" },
  "2024-04-16": { nameTh: "วันหยุดชดเชยวันสงกรานต์", nameEn: "Substitution for Songkran Festival", type: "substitute" },
  "2024-05-06": { nameTh: "วันหยุดชดเชยวันฉัตรมงคล", nameEn: "Substitution for Coronation Day", type: "substitute" },
  "2024-05-22": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2024-07-20": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2024-07-22": { nameTh: "วันหยุดชดเชยวันอาสาฬหบูชา", nameEn: "Substitution for Asahna Bucha Day", type: "substitute" },
  "2024-07-29": { nameTh: "วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10", nameEn: "Substitution for King's Birthday", type: "substitute" },
  "2024-10-14": { nameTh: "วันหยุดชดเชยวันนวมินทรมหาราช", nameEn: "Substitution for King Bhumibol Memorial Day", type: "substitute" },

  // ─── 2025 ───
  "2025-02-12": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2025-04-07": { nameTh: "วันหยุดชดเชยวันจักรี", nameEn: "Substitution for Chakri Memorial Day", type: "substitute" },
  "2025-05-05": { nameTh: "วันหยุดชดเชยวันฉัตรมงคล", nameEn: "Substitution for Coronation Day", type: "substitute" },
  "2025-05-11": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2025-05-12": { nameTh: "วันหยุดชดเชยวันวิสาขบูชา", nameEn: "Substitution for Visakha Bucha Day", type: "substitute" },
  "2025-07-10": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2025-07-11": { nameTh: "วันเข้าพรรษา", nameEn: "Buddhist Lent Day", type: "buddhist" },

  // ─── 2026 (Current Year) ───
  "2026-01-02": { nameTh: "วันหยุดพิเศษปีใหม่", nameEn: "Special New Year Holiday", type: "national" },
  "2026-03-03": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2026-04-06": { nameTh: "วันจักรี", nameEn: "Chakri Memorial Day", type: "royal" },
  "2026-04-16": { nameTh: "วันหยุดชดเชยวันสงกรานต์", nameEn: "Substitution for Songkran Festival", type: "substitute" },
  "2026-05-04": { nameTh: "วันฉัตรมงคล", nameEn: "Coronation Day", type: "royal" },
  "2026-05-31": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2026-06-01": { nameTh: "วันหยุดชดเชยวันวิสาขบูชา", nameEn: "Substitution for Visakha Bucha Day", type: "substitute" },
  "2026-07-28": { nameTh: "วันเฉลิมพระชนมพรรษา ร.10", nameEn: "H.M. King's Birthday", type: "royal" },
  "2026-07-29": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2026-07-30": { nameTh: "วันเข้าพรรษา", nameEn: "Buddhist Lent Day", type: "buddhist" },
  "2026-08-12": { nameTh: "วันแม่แห่งชาติ", nameEn: "Mother's Day", type: "royal" },
  "2026-10-13": { nameTh: "วันนวมินทรมหาราช", nameEn: "King Bhumibol Adulyadej Memorial Day", type: "royal" },
  "2026-10-23": { nameTh: "วันปิยมหาราช", nameEn: "Chulalongkorn Memorial Day", type: "royal" },
  "2026-12-07": { nameTh: "วันหยุดชดเชยวันพ่อแห่งชาติ", nameEn: "Substitution for Father's Day", type: "substitute" },

  // ─── 2027 (Next Year) ───
  "2027-02-21": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2027-02-22": { nameTh: "วันหยุดชดเชยวันมาฆบูชา", nameEn: "Substitution for Makha Bucha Day", type: "substitute" },
  "2027-04-16": { nameTh: "วันหยุดชดเชยวันสงกรานต์", nameEn: "Substitution for Songkran Festival", type: "substitute" },
  "2027-05-20": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2027-07-18": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2027-07-19": { nameTh: "วันเข้าพรรษา / ชดเชยวันอาสาฬหบูชา", nameEn: "Buddhist Lent / Substitution Day", type: "substitute" },
  "2027-10-25": { nameTh: "วันหยุดชดเชยวันปิยมหาราช", nameEn: "Substitution for Chulalongkorn Day", type: "substitute" },
  "2027-12-06": { nameTh: "วันหยุดชดเชยวันพ่อแห่งชาติ", nameEn: "Substitution for Father's Day", type: "substitute" },

  // ─── 2028 ───
  "2028-02-10": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2028-05-08": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2028-07-06": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2028-07-07": { nameTh: "วันเข้าพรรษา", nameEn: "Buddhist Lent Day", type: "buddhist" },
  "2028-08-14": { nameTh: "วันหยุดชดเชยวันแม่แห่งชาติ", nameEn: "Substitution for Mother's Day", type: "substitute" },

  // ─── 2029 ───
  "2029-02-28": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2029-05-27": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2029-05-28": { nameTh: "วันหยุดชดเชยวันวิสาขบูชา", nameEn: "Substitution for Visakha Bucha Day", type: "substitute" },
  "2029-07-26": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2029-07-27": { nameTh: "วันเข้าพรรษา", nameEn: "Buddhist Lent Day", type: "buddhist" },
  "2029-07-30": { nameTh: "วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10", nameEn: "Substitution for King's Birthday", type: "substitute" },

  // ─── 2030 ───
  "2030-02-17": { nameTh: "วันมาฆบูชา", nameEn: "Makha Bucha Day", type: "buddhist" },
  "2030-02-18": { nameTh: "วันหยุดชดเชยวันมาฆบูชา", nameEn: "Substitution for Makha Bucha Day", type: "substitute" },
  "2030-04-08": { nameTh: "วันหยุดชดเชยวันจักรี", nameEn: "Substitution for Chakri Day", type: "substitute" },
  "2030-05-06": { nameTh: "วันหยุดชดเชยวันฉัตรมงคล", nameEn: "Substitution for Coronation Day", type: "substitute" },
  "2030-05-16": { nameTh: "วันวิสาขบูชา", nameEn: "Visakha Bucha Day", type: "buddhist" },
  "2030-07-15": { nameTh: "วันอาสาฬหบูชา", nameEn: "Asahna Bucha Day", type: "buddhist" },
  "2030-07-16": { nameTh: "วันเข้าพรรษา", nameEn: "Buddhist Lent Day", type: "buddhist" },
  "2030-07-29": { nameTh: "วันหยุดชดเชยวันเฉลิมพระชนมพรรษา ร.10", nameEn: "Substitution for King's Birthday", type: "substitute" },
  "2030-10-14": { nameTh: "วันหยุดชดเชยวันนวมินทรมหาราช", nameEn: "Substitution for King Bhumibol Memorial Day", type: "substitute" },
};

/** Get Thai Holiday details for a specific Date (if any) */
export function getThaiHolidayForDate(date: Date): ThaiHoliday | null {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const fullKey = `${yyyy}-${mm}-${dd}`;
  const monthDayKey = `${mm}-${dd}`;

  // 1. Check year-specific holiday (lunar, substitute, special)
  if (YEAR_SPECIFIC_HOLIDAYS[fullKey]) {
    const item = YEAR_SPECIFIC_HOLIDAYS[fullKey];
    return {
      date: fullKey,
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      isOfficial: true,
      type: item.type,
    };
  }

  // 2. Check annual fixed holiday (Applies automatically to EVERY year)
  if (FIXED_ANNUAL_HOLIDAYS[monthDayKey]) {
    const item = FIXED_ANNUAL_HOLIDAYS[monthDayKey];
    return {
      date: fullKey,
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      isOfficial: true,
      type: item.type,
    };
  }

  // 3. Automatic Monday substitute holiday calculation for fixed holidays on weekends
  // If today is Monday (day 1), check if yesterday (Sunday) or Saturday was a fixed holiday
  if (date.getDay() === 1) {
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - 1);
    const sunMMDD = `${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
    
    const saturday = new Date(date);
    saturday.setDate(date.getDate() - 2);
    const satMMDD = `${String(saturday.getMonth() + 1).padStart(2, "0")}-${String(saturday.getDate()).padStart(2, "0")}`;

    if (FIXED_ANNUAL_HOLIDAYS[sunMMDD]) {
      const parent = FIXED_ANNUAL_HOLIDAYS[sunMMDD];
      return {
        date: fullKey,
        nameTh: `วันหยุดชดเชย${parent.nameTh}`,
        nameEn: `Substitution for ${parent.nameEn}`,
        isOfficial: true,
        type: "substitute",
      };
    } else if (FIXED_ANNUAL_HOLIDAYS[satMMDD]) {
      const parent = FIXED_ANNUAL_HOLIDAYS[satMMDD];
      return {
        date: fullKey,
        nameTh: `วันหยุดชดเชย${parent.nameTh}`,
        nameEn: `Substitution for ${parent.nameEn}`,
        isOfficial: true,
        type: "substitute",
      };
    }
  }

  return null;
}

/** Check if a date is an official Thai Public Holiday */
export function isThaiHoliday(date: Date): boolean {
  return getThaiHolidayForDate(date) !== null;
}
