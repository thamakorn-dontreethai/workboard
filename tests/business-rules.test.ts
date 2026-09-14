import { describe, it, expect } from "vitest";
import { isOverdue, isDueSoon, formatDate, formatRelativeDate } from "../lib/utils/date";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "../types";

describe("Business Rules & Calculations Tests", () => {
  it("should calculate overdue status correctly", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    // Overdue when due in past and not completed
    expect(isOverdue(pastDate, "in_progress")).toBe(true);
    expect(isOverdue(pastDate, "todo")).toBe(true);

    // NOT overdue when completed/approved/cancelled
    expect(isOverdue(pastDate, "done")).toBe(false);
    expect(isOverdue(pastDate, "approved")).toBe(false);
    expect(isOverdue(pastDate, "cancelled")).toBe(false);

    // NOT overdue when due in future
    expect(isOverdue(futureDate, "in_progress")).toBe(false);
    expect(isOverdue(null, "in_progress")).toBe(false);
  });

  it("should calculate due soon status correctly", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    expect(isDueSoon(tomorrow, "in_progress")).toBe(true);
    expect(isDueSoon(nextMonth, "in_progress")).toBe(false);
    expect(isDueSoon(tomorrow, "done")).toBe(false);
  });

  it("should format dates accurately", () => {
    const testDate = new Date("2026-09-15T10:00:00Z");
    const formatted = formatDate(testDate);
    expect(formatted).toContain("Sep 15");
  });

  it("should have complete Monday.com status and priority configurations", () => {
    expect(TASK_STATUS_CONFIG.in_progress.label).toBe("Working on it");
    expect(TASK_STATUS_CONFIG.done.label).toBe("Done");
    expect(TASK_STATUS_CONFIG.blocked.label).toBe("Stuck");
    expect(TASK_STATUS_CONFIG.todo.label).toBe("To Do");

    expect(TASK_PRIORITY_CONFIG.urgent.label).toBe("Urgent");
    expect(TASK_PRIORITY_CONFIG.high.label).toBe("High");
    expect(TASK_PRIORITY_CONFIG.medium.label).toBe("Medium");
    expect(TASK_PRIORITY_CONFIG.low.label).toBe("Low");
  });
});
