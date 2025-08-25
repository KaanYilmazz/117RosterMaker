import React, { useState } from 'react';
import { Plus, Clock, Edit2, Trash2, Users } from 'lucide-react';
import { Shift, Position, POSITION_LABELS, DAYS_OF_WEEK } from '../types';

interface Props {
  shifts: Shift[];
  onAddShift: (shift: Omit<Shift, 'id'>) => void;
  onUpdateShift: (id: string, shift: Omit<Shift, 'id'>) => void;
  onDeleteShift: (id: string) => void;
}

export default function ShiftManager({ shifts, onAddShift, onUpdateShift, onDeleteShift }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    day: 'Monday',
    startTime: '',
    endTime: '',
    requiredPosition: '' as Position | '',
    minStaffCount: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shiftData = {
      ...formData,
      requiredPosition: formData.requiredPosition || null
    };

    if (formData.day === "Everyday") {
      const shifts = DAYS_OF_WEEK.filter(d => d !== "Everyday").map(day => ({
        ...shiftData,
        day
      }));
      
      shifts.forEach(s => onAddShift(s));
    } else if (editingShift) {
      onUpdateShift(editingShift.id, shiftData);
      setEditingShift(null);
    } else {
      onAddShift(shiftData);
    }
    
    
    setFormData({
      name: '',
      day: 'Monday',
      startTime: '',
      endTime: '',
      requiredPosition: '',
      minStaffCount: 1
    });
    setShowForm(false); 
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      day: shift.day,
      startTime: shift.startTime,
      endTime: shift.endTime,
      requiredPosition: shift.requiredPosition || '',
      minStaffCount: shift.minStaffCount
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingShift(null);
    setFormData({
      name: '',
      day: 'Monday',
      startTime: '',
      endTime: '',
      requiredPosition: '',
      minStaffCount: 1
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Shifts</h2>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
            {shifts.length} shifts
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Shift
        </button>
      </div>

      {showForm && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shift Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Morning Rush, Lunch Shift"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day *
                </label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Position
                </label>
                <select
                  value={formData.requiredPosition}
                  onChange={(e) => setFormData({ ...formData, requiredPosition: e.target.value as Position })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Position</option>
                  {Object.entries(POSITION_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Staff Count *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.minStaffCount}
                  onChange={(e) => setFormData({ ...formData, minStaffCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {editingShift ? 'Update Shift' : 'Add Shift'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        {shifts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No shifts created yet</p>
            <p className="text-sm text-gray-400 mt-1">Add shifts to start building your roster</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayShifts = shifts.filter(shift => shift.day === day);
              if (dayShifts.length === 0) return null;
              
              return (
                <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900">{day}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {dayShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{shift.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {shift.minStaffCount} staff min
                              </span>
                              {shift.requiredPosition && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  {POSITION_LABELS[shift.requiredPosition]} required
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(shift)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteShift(shift.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}