export type Location = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  pin: string;
  hourly_rate: number;
  is_active: boolean;
  location_id: string;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
};

// Shape exposed to the public clock-in screen — never includes pin/rate.
export type PublicEmployee = {
  id: string;
  name: string;
};

export type Punch = {
  id: string;
  employee_id: string;
  location_id: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
  created_at: string;
};

export type Schedule = {
  id: string;
  employee_id: string;
  location_id: string;
  day_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm or HH:mm:ss
  end_time: string;
};

// What the public clock-in screen receives after a correct PIN.
export type PunchView = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
};

export type ScheduleView = {
  id: string;
  day_date: string;
  start_time: string;
  end_time: string;
};

export type SessionData = {
  employee: PublicEmployee;
  status: "in" | "out";
  openSince: string | null; // clock_in of the open punch, if clocked in
  weekStart: string; // Monday YYYY-MM-DD (restaurant time)
  weekHours: number;
  todayPunches: PunchView[];
  weekSchedule: ScheduleView[];
  hasScheduleForWeek: boolean;
};
