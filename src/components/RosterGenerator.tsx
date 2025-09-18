import React, { useState } from 'react';
import { Zap, Users, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Employee, Shift, Availability, RosterEntry, POSITION_LABELS, POSITION_COLORS, DAYS_OF_WEEK } from '../types';
import { collection, getDocs, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "./../firebase";

interface Props {
  employees: Employee[];
  shifts: Shift[];
  availabilities: Availability[];
  roster: RosterEntry[];
  onGenerateRoster: (roster: RosterEntry[]) => void;
}

export default function RosterGenerator({ employees, shifts, availabilities, roster, onGenerateRoster }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('current');

const generateRoster = async () => {
  setIsGenerating(true);

  await new Promise(resolve => setTimeout(resolve, 1500));

  const newRoster: RosterEntry[] = [];

  // Çalışan bazında shift ve gün sayısı + saat hesabı
  const employeeShiftCounts: Record<string, number> = {};
  const employeeDayCounts: Record<string, Set<string>> = {};
  const employeeHours: Record<string, number> = {};

  employees.forEach(emp => {
    employeeShiftCounts[emp.id] = 0;
    employeeDayCounts[emp.id] = new Set();
    employeeHours[emp.id] = 0;
  });

  const sortedShifts = [...shifts].sort((a, b) => {
    if (a.requiredPosition && !b.requiredPosition) return -1;
    if (!a.requiredPosition && b.requiredPosition) return 1;
    return b.minStaffCount - a.minStaffCount;
  });

  sortedShifts.forEach(shift => {
    const shiftStart = new Date(`2000-01-01T${shift.startTime}`);
    const shiftEnd = new Date(`2000-01-01T${shift.endTime}`);
    const shiftHours = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60);

    const availableEmployees = employees.filter(emp => {
      const availability = availabilities.find(
        a => a.employeeId === emp.id && a.day === shift.day && a.isAvailable
      );

      if (!availability) return false;

      const availStart = new Date(`2000-01-01T${availability.startTime}`);
      const availEnd = new Date(`2000-01-01T${availability.endTime}`);
      const canWork = availStart <= shiftStart && availEnd >= shiftEnd;

      const positionMatch = !shift.requiredPosition || emp.position === shift.requiredPosition;

      // Hard constraint 1: Aynı gün sadece 1 shift
      if (employeeDayCounts[emp.id].has(shift.day)) return false;

      // Hard constraint 2: En fazla 5 gün çalışma
      if (employeeDayCounts[emp.id].size >= 5) return false;

      // Çakışma kontrolü (zaten vardı)
      const hasConflict = newRoster.some(entry =>
        entry.employeeId === emp.id &&
        entry.day === shift.day &&
        (
          (new Date(`2000-01-01T${entry.startTime}`) <= shiftStart &&
           new Date(`2000-01-01T${entry.endTime}`) > shiftStart) ||
          (new Date(`2000-01-01T${entry.startTime}`) < shiftEnd &&
           new Date(`2000-01-01T${entry.endTime}`) >= shiftEnd)
        )
      );

      return canWork && positionMatch && !hasConflict;
    });

    availableEmployees.sort((a, b) => {
      // Soft constraint: saat hedeflerine yakınlık
      const targetHoursA = a.position !== "6part-time-staff" ? 37.5 : 20;
      const targetHoursB = b.position !== "6part-time-staff" ? 37.5 : 20;
      const diffA = targetHoursA - employeeHours[a.id];
      const diffB = targetHoursB - employeeHours[b.id];

      if (diffA !== diffB) return diffB - diffA; // ihtiyacı daha fazla olan öne gelsin

      // Shift sayısı daha az olan öne gelsin
      const countDiff = employeeShiftCounts[a.id] - employeeShiftCounts[b.id];
      if (countDiff !== 0) return countDiff;

      // Pozisyona göre sıralama (senin mevcut mantığın)
      const positionOrder = [
        "1manager",
        "2assistant-manager",
        "3head-barista",
        "4senior-staff",
        "5regular-staff",
        "6part-time-staff"
      ];
      return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });

    const assignedCount = Math.min(shift.minStaffCount, availableEmployees.length);

    for (let i = 0; i < assignedCount; i++) {
      const employee = availableEmployees[i];
      newRoster.push({
        shiftId: shift.id,
        employeeId: employee.id,
        day: shift.day,
        startTime: shift.startTime,
        endTime: shift.endTime
      });
      employeeShiftCounts[employee.id]++;
      employeeDayCounts[employee.id].add(shift.day);
      employeeHours[employee.id] += shiftHours;
    }
  });

  // Firestore kısmın aynı kalıyor
  const rosterRef = collection(db, "rosters");
  const snapshot = await getDocs(rosterRef);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  const addPromises = newRoster.map(entry => addDoc(rosterRef, entry));
  await Promise.all(addPromises);

  setIsGenerating(false);
  onGenerateRoster(newRoster);
};


  const getShiftCoverage = () => {
    const coverage = {
      total: shifts.length,
      fullyStaffed: 0,
      partiallyStaffed: 0,
      unstaffed: 0
    };
    
    shifts.forEach(shift => {
      const assignedCount = roster.filter(entry => entry.shiftId === shift.id).length;
      if (assignedCount >= shift.minStaffCount) {
        coverage.fullyStaffed++;
      } else if (assignedCount > 0) {
        coverage.partiallyStaffed++;
      } else {
        coverage.unstaffed++;
      }
    });
    
    return coverage;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const coverage = getShiftCoverage();

  return (
    <div className="space-y-6">
      {/* Magic Button & Controls */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-200 bg-white/50">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Magic Roster Generator</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-600">Ready to generate roster for</span>
                <span className="font-medium text-gray-900 ml-1">{shifts.length} shifts</span>
                <span className="text-gray-600 ml-1">across {employees.length} employees</span>
              </div>
            </div>
            
            <button
              onClick={generateRoster}
              disabled={isGenerating || shifts.length === 0 || employees.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Generate Roster
                </>
              )}
            </button>
          </div>
        </div>
        
        {(shifts.length === 0 || employees.length === 0) && (
          <div className="px-6 py-4 bg-amber-50 border-l-4 border-amber-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="text-sm text-amber-800">
                {shifts.length === 0 && employees.length === 0 && "Add employees and create shifts to generate a roster"}
                {shifts.length === 0 && employees.length > 0 && "Create shifts to generate a roster"}
                {shifts.length > 0 && employees.length === 0 && "Add employees to generate a roster"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Roster Overview */}
      {roster.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Generated Roster</h3>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{coverage.fullyStaffed} fully staffed</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600">{coverage.partiallyStaffed} partial</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">{coverage.unstaffed} unstaffed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {DAYS_OF_WEEK.map((day) => {
                const dayShifts = shifts.filter(s => s.day === day);
                if (dayShifts.length === 0) return null;
                
                return (
                  <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="font-medium text-gray-900">{day}</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {dayShifts.map((shift) => {
                        const shiftRosterEntries = roster.filter(entry => entry.shiftId === shift.id);
                        const isFullyStaffed = shiftRosterEntries.length >= shift.minStaffCount;
                        const isPartiallyStaffed = shiftRosterEntries.length > 0 && shiftRosterEntries.length < shift.minStaffCount;
                        
                        return (
                          <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <h5 className="font-medium text-gray-900">{shift.name}</h5>
                                <span className="text-sm text-gray-500">
                                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  isFullyStaffed ? 'bg-green-100 text-green-700' :
                                  isPartiallyStaffed ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {shiftRosterEntries.length}/{shift.minStaffCount} staff
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {shiftRosterEntries.map((entry, index) => {
                                const employee = employees.find(e => e.id === entry.employeeId);
                                if (!employee) return null;
                                
                                return (
                                  <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">{employee.name}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${POSITION_COLORS[employee.position]}`}>
                                      {POSITION_LABELS[employee.position]}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              {shiftRosterEntries.length === 0 && (
                                <div className="text-sm text-red-600 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  No staff assigned
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}