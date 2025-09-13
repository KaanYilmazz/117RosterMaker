export type Position = '1manager' | '2assistant-manager' | '3head-barista' | '4senior-staff' | '5regular-staff' | '6part-time-staff';

export interface Employee {
  id: string;
  name: string;
  position: Position;
  email?: string;
  phone?: string;
}

export interface Shift {
  id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  requiredPosition: Position | null;
  minStaffCount: number;
}

export interface Availability {
  id: string;
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RosterEntry {
  id: string;
  shiftId: string;
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export const POSITION_LABELS: Record<Position, string> = {
  '1manager': 'Manager',
  '2assistant-manager': 'Assistant Manager',
  '3head-barista': 'Head Barista',
  '4senior-staff': 'Senior Staff',
  '5regular-staff': 'Regular Staff',
  '6part-time-staff': 'Part-time Staff'
};

export const POSITION_COLORS: Record<Position, string> = {
  '1manager': 'bg-purple-100 text-purple-800',
  '2assistant-manager': 'bg-blue-100 text-blue-800',
  '3head-barista': 'bg-amber-100 text-amber-800',
  '4senior-staff': 'bg-green-100 text-green-800',
  '5regular-staff': 'bg-gray-100 text-gray-800',
  '6part-time-staff': 'bg-pink-100 text-pink-800'
};

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday'
];