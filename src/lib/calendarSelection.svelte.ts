function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

class CalendarSelectionStore {
  date = $state(startOfDay(new Date()));

  select(d: Date) {
    this.date = startOfDay(d);
  }

  resetToToday() {
    this.date = startOfDay(new Date());
  }
}

export const calendarSelection = new CalendarSelectionStore();
