import React, { useState } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';
import { Employee, Availability, DAYS_OF_WEEK, POSITION_LABELS } from '../types';

interface Props {
  employees: Employee[];
  availabilities: Availability[];
  onUpdateAvailability: (employeeId: string, day: string, availability: Partial<Availability>) => void;
}

export default function AvailabilityManager({ employees, availabilities, onUpdateAvailability }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const getAvailability = (employeeId: string, day: string): Availability | null => {
    return availabilities.find(a => a.employeeId === employeeId && a.day === day) || null;
  };

  const updateAvailability = (employeeId: string, day: string, updates: Partial<Availability>) => {
    const existing = getAvailability(employeeId, day);
    const availability: Partial<Availability> = {
      ...existing,
      ...updates,
      employeeId,
      day
    };
    onUpdateAvailability(employeeId, day, availability);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Staff Availability</h2>
        </div>
        
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} ({POSITION_LABELS[employee.position]})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No employees added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add employees first to manage their availability</p>
          </div>
        ) : (
          <div className="space-y-6">
            {employees
              .filter(employee => !selectedEmployee || employee.id === selectedEmployee)
              .map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{employee.name}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {POSITION_LABELS[employee.position]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid gap-4">
                      {DAYS_OF_WEEK.map((day) => {
                        const availability = getAvailability(employee.id, day);
                        const isAvailable = availability?.isAvailable || false;
                        
                        return (
                          <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900 w-20">{day}</span>
                              <button
                                onClick={() => updateAvailability(employee.id, day, { 
                                  isAvailable: !isAvailable,
                                  startTime: availability?.startTime || '09:00',
                                  endTime: availability?.endTime || '17:00'
                                })}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                  isAvailable
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {isAvailable ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Available
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4" />
                                    Not Available
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {isAvailable && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <input
                                  type="time"
                                  value={availability?.startTime || '09:00'}
                                  onChange={(e) => updateAvailability(employee.id, day, { 
                                    startTime: e.target.value,
                                    isAvailable: true
                                  })}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                  type="time"
                                  value={availability?.endTime || '17:00'}
                                  onChange={(e) => updateAvailability(employee.id, day, { 
                                    endTime: e.target.value,
                                    isAvailable: true
                                  })}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}