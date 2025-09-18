import React, { useState } from 'react';
import { Calendar, Clock, User, Users, ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Employee, Shift, RosterEntry, POSITION_LABELS, POSITION_COLORS, DAYS_OF_WEEK } from '../types';
import { differenceInMinutes, parse } from "date-fns";

interface Props {
  employees: Employee[];
  shifts: Shift[];
  roster: RosterEntry[];
  onUpdateRoster: (roster: RosterEntry[]) => void;
}

export default function WeeklyRosterView({ employees, shifts, roster, onUpdateRoster }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);
  const [swapMode, setSwapMode] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getShiftById = (shiftId: string) => {
    return shifts.find(s => s.id === shiftId);
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(e => e.id === employeeId);
  };

  const getDayShifts = (day: string) => {
    return shifts.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getShiftRosterEntries = (shiftId: string) => {
    return roster.filter(entry => entry.shiftId === shiftId);
  };

  const handleSwapEmployees = (entry1: RosterEntry, entry2: RosterEntry) => {
    const updatedRoster = roster.map(entry => {
      if (entry === entry1) {
        return { ...entry, employeeId: entry2.employeeId };
      }
      if (entry === entry2) {
        return { ...entry, employeeId: entry1.employeeId };
      }
      return entry;
    });
    onUpdateRoster(updatedRoster);
    setSelectedEntry(null);
    setSwapMode(false);
  };

  const handleRemoveFromShift = (entryToRemove: RosterEntry) => {
    const updatedRoster = roster.filter(entry => entry !== entryToRemove);
    onUpdateRoster(updatedRoster);
  };

  const handleAddToShift = (shiftId: string, employeeId: string) => {
    const shift = getShiftById(shiftId);
    if (!shift) return;

    const newEntry: RosterEntry = {
      shiftId,
      employeeId,
      day: shift.day,
      startTime: shift.startTime,
      endTime: shift.endTime
    };

    onUpdateRoster([...roster, newEntry]);
  };

  const getAvailableEmployeesForShift = (shiftId: string) => {
    const shift = getShiftById(shiftId);
    if (!shift) return [];

    const assignedEmployeeIds = getShiftRosterEntries(shiftId).map(entry => entry.employeeId);

    return employees.filter(emp => {
      // Don't show already assigned employees
      if (assignedEmployeeIds.includes(emp.id)) return false;

      // Check position requirements
      if (shift.requiredPosition && emp.position !== shift.requiredPosition) return false;

      // Check for conflicts with other shifts on the same day
      const hasConflict = roster.some(entry =>
        entry.employeeId === emp.id &&
        entry.day === shift.day &&
        entry.shiftId !== shiftId &&
        (
          (new Date(`2000-01-01T${entry.startTime}`) <= new Date(`2000-01-01T${shift.startTime}`) &&
            new Date(`2000-01-01T${entry.endTime}`) > new Date(`2000-01-01T${shift.startTime}`)) ||
          (new Date(`2000-01-01T${entry.startTime}`) < new Date(`2000-01-01T${shift.endTime}`) &&
            new Date(`2000-01-01T${entry.endTime}`) >= new Date(`2000-01-01T${shift.endTime}`))
        )
      );

      return !hasConflict;
    });
  };
  


  if (roster.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Weekly Roster View</h2>
          </div>
        </div>
        <div className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Roster Generated</h3>
          <p className="text-gray-500 mb-4">Generate a roster first to view and manage your weekly schedule</p>
          <p className="text-sm text-gray-400">Go to the Magic Roster tab to create your schedule</p>
        </div>
      </div>
    );
  }

  // Çalışma saatlerini hesapla
    const totals: Record<string, number> = {};
  
    roster.forEach(entry => {
      const start = parse(entry.startTime, "HH:mm", new Date());
      const end = parse(entry.endTime, "HH:mm", new Date());
  
      let minutes = differenceInMinutes(end, start);
      if (minutes < 0) minutes += 24 * 60; // gece yarısını geçen shift için
      else if (minutes > 480) minutes = minutes - 30; // 8 saatten uzun shift için 30 dakika mola çıkar
      else  minutes = minutes - 15; // shift için 15 dakika mola çıkar
      if (!totals[entry.employeeId]) {
        totals[entry.employeeId] = 0;
      }
      totals[entry.employeeId] += minutes;
    });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Weekly Roster View</h2>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm font-medium">
                {roster.length} assignments
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSwapMode(!swapMode);
                  setSelectedEntry(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${swapMode
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                {swapMode ? 'Exit Swap Mode' : 'Swap Employees'}
              </button>
            </div>
          </div>

          {swapMode && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <ArrowLeftRight className="w-4 h-4" />
                <span className="font-medium">Swap Mode Active:</span>
                <span>Click on two employees to swap their shifts</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        {/* Weekly Grid */}
        <div className="col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="grid gap-6">
              {DAYS_OF_WEEK.map((day) => {
                const dayShifts = getDayShifts(day);
                if (dayShifts.length === 0) return null;

                return (
                  <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 text-lg">{day}</h3>
                    </div>

                    <div className="p-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {dayShifts.map((shift) => {
                          const shiftEntries = getShiftRosterEntries(shift.id);
                          const isFullyStaffed = shiftEntries.length >= shift.minStaffCount;
                          const availableEmployees = getAvailableEmployeesForShift(shift.id);

                          return (
                            <div key={shift.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium text-gray-900">{shift.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isFullyStaffed ? 'bg-green-100 text-green-700' :
                                      shiftEntries.length > 0 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {shiftEntries.length}/{shift.minStaffCount}
                                  </span>
                                  {isFullyStaffed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                  )}
                                </div>
                              </div>

                              {/* Assigned Employees */}
                              <div className="space-y-2 mb-3">
                                {shiftEntries.map((entry, index) => {
                                  const employee = getEmployeeById(entry.employeeId);
                                  if (!employee) return null;

                                  const isSelected = selectedEntry === entry;

                                  return (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        if (swapMode) {
                                          if (selectedEntry && selectedEntry !== entry) {
                                            handleSwapEmployees(selectedEntry, entry);
                                          } else {
                                            setSelectedEntry(entry);
                                          }
                                        }
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${swapMode
                                          ? isSelected
                                            ? 'bg-amber-100 border-2 border-amber-300 shadow-sm'
                                            : 'bg-white border border-gray-200 hover:border-amber-200 hover:bg-amber-50'
                                          : 'bg-white border border-gray-200'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-gray-900 text-sm">{employee.name}</span>
                                      </div>

                                      {!swapMode && (
                                        <button
                                          onClick={() => handleRemoveFromShift(entry)}
                                          className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add Employee Dropdown */}
                              {!swapMode && availableEmployees.length > 0 && (
                                <div className="border-t border-gray-200 pt-3">
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleAddToShift(shift.id, e.target.value);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    defaultValue=""
                                  >
                                    <option value="">+ Add employee to shift</option>
                                    {availableEmployees.map((employee) => (
                                      <option key={employee.id} value={employee.id}>
                                        {employee.name} ({POSITION_LABELS[employee.position]})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* No staff assigned message */}
                              {shiftEntries.length === 0 && (
                                <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                                  No staff assigned
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Total Hours</h2>
              </div>
            </div>

            <div className="p-6">
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No employees found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {employees.map((employee) => {
                    const hours = ((totals[employee.id] ?? 0) / 60).toFixed(2);
                    return (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-500">
                              {employee.position}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{hours}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}