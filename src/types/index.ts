export type Position = 'manager' | 'assistant-manager' | 'head-barista' | 'senior-staff' | 'regular-staff' | 'part-time-staff';

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
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface RosterEntry {
  shiftId: string;
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export const POSITION_LABELS: Record<Position, string> = {
  'manager': 'Manager',
  'assistant-manager': 'Assistant Manager',
  'head-barista': 'Head Barista',
  'senior-staff': 'Senior Staff',
  'regular-staff': 'Regular Staff',
  'part-time-staff': 'Part-time Staff'
};

export const POSITION_COLORS: Record<Position, string> = {
  'manager': 'bg-purple-100 text-purple-800',
  'assistant-manager': 'bg-blue-100 text-blue-800',
  'head-barista': 'bg-amber-100 text-amber-800',
  'senior-staff': 'bg-green-100 text-green-800',
  'regular-staff': 'bg-gray-100 text-gray-800',
  'part-time-staff': 'bg-pink-100 text-pink-800'
};

export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Everyday'
];