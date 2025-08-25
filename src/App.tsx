import React, { useState, useEffect } from 'react';
import { Coffee, Users, Clock, Calendar, Zap } from 'lucide-react';
import EmployeeManager from './components/EmployeeManager';
import ShiftManager from './components/ShiftManager';
import AvailabilityManager from './components/AvailabilityManager';
import RosterGenerator from './components/RosterGenerator';
import WeeklyRosterView from './components/WeeklyRosterView';
import { Employee, Shift, Availability, RosterEntry } from './types';
import { doc, collection, addDoc, getDocs,  deleteDoc, updateDoc} from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEmployees = localStorage.getItem('cafeEmployees');
    const savedShifts = localStorage.getItem('cafeShifts');
    const savedAvailabilities = localStorage.getItem('cafeAvailabilities');
    const savedRoster = localStorage.getItem('cafeRoster');

    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    if (savedShifts) setShifts(JSON.parse(savedShifts));
    if (savedAvailabilities) setAvailabilities(JSON.parse(savedAvailabilities));
    if (savedRoster) setRoster(JSON.parse(savedRoster));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cafeEmployees', JSON.stringify(employees));
  }, [employees]);


  useEffect(() => {
  const fetchShifts = async () => {
    const querySnapshot = await getDocs(collection(db, "shifts"));
    const shiftsData = querySnapshot.docs.map(doc => ({
      id: doc.id, // Firestore’un verdiği id
      ...doc.data(),
    })) as Shift[];
    setShifts(shiftsData);
  };

  fetchShifts();
}, []);

  useEffect(() => {
    localStorage.setItem('cafeAvailabilities', JSON.stringify(availabilities));
  }, [availabilities]);

  useEffect(() => {
    localStorage.setItem('cafeRoster', JSON.stringify(roster));
  }, [roster]);

  // Employee management functions
  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString()
    };
    setEmployees([...employees, newEmployee]);
  };

  const updateEmployee = (id: string, employee: Omit<Employee, 'id'>) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...employee, id } : emp));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
    setAvailabilities(availabilities.filter(avail => avail.employeeId !== id));
    setRoster(roster.filter(entry => entry.employeeId !== id));
  };

  // Shift management functions
  const addShift =async (shift: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shift,
      id: crypto.randomUUID()
    };
     // Firestore’a kaydet
     console.log("Adding shift:", newShift);
  await addDoc(collection(db, "shifts"), newShift);

  // Local state’i de güncelle
    setShifts(prev => [...prev, newShift]); // ✅ her seferinde en güncel listeyi alır
  };

// Silme
const deleteShift = async (id: string) => {
  await deleteDoc(doc(db, "shifts", id));
  setShifts(prev => prev.filter(s => s.id !== id));
};

// Güncelleme
const updateShift = async (id: string, data: Partial<Shift>) => {
  await updateDoc(doc(db, "shifts", id), data);
  setShifts(prev =>
    prev.map(s => (s.id === id ? { ...s, ...data } : s))
  );
};

  // Availability management functions
  const updateAvailability = (employeeId: string, day: string, availability: Partial<Availability>) => {
    const existingIndex = availabilities.findIndex(
      a => a.employeeId === employeeId && a.day === day
    );

    if (existingIndex >= 0) {
      const updated = [...availabilities];
      updated[existingIndex] = { ...updated[existingIndex], ...availability };
      setAvailabilities(updated);
    } else {
      const newAvailability: Availability = {
        employeeId,
        day,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
        ...availability
      };
      setAvailabilities([...availabilities, newAvailability]);
    }
  };

  // Roster generation function
  const generateRoster = (newRoster: RosterEntry[]) => {
    setRoster(newRoster);
  };

  const tabs = [
    { id: 'employees', label: 'Staff', icon: Users },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'roster', label: 'Magic Roster', icon: Zap },
    { id: 'weekly', label: 'Weekly View', icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Cafe Manager</h1>
                <p className="text-sm text-gray-500">Staff scheduling made simple</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>{employees.length} staff members</span>
              <span>{shifts.length} shifts</span>
              <span>{roster.length} roster entries</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftManager
            shifts={shifts}
            onAddShift={addShift}
            onUpdateShift={updateShift}
            onDeleteShift={deleteShift}
          />
        )}

        {activeTab === 'availability' && (
          <AvailabilityManager
            employees={employees}
            availabilities={availabilities}
            onUpdateAvailability={updateAvailability}
          />
        )}

        {activeTab === 'roster' && (
          <RosterGenerator
            employees={employees}
            shifts={shifts}
            availabilities={availabilities}
            roster={roster}
            onGenerateRoster={generateRoster}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyRosterView
            employees={employees}
            shifts={shifts}
            roster={roster}
            onUpdateRoster={setRoster}
          />
        )}
      </main>
    </div>
  );
}

export default App;