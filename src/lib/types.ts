export type Employee = {
  id: string;
  name: string;
  pin: string;
  hourly_rate: number;
  is_active: boolean;
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
  clock_in: string;
  clock_out: string | null;
  note: string | null;
  created_at: string;
};

export type Schedule = {
  id: string;
  employee_id: string;
  day_date: string; // YYYY-MM-DD
  start_time: string; // HH:mm or HH:mm:ss
  end_time: string;
};
