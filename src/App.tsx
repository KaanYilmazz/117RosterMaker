import React, { useState, useEffect } from 'react';
import { Coffee, Users, Clock, Calendar, Zap, View } from 'lucide-react';
import EmployeeManager from './components/EmployeeManager';
import ShiftManager from './components/ShiftManager';
import AvailabilityManager from './components/AvailabilityManager';
import RosterGenerator from './components/RosterGenerator';
import WeeklyRosterView from './components/WeeklyRosterView';
import { Employee, Shift, Availability, RosterEntry } from './types';
import { doc, collection, addDoc, setDoc, getDocs, deleteDoc, updateDoc,onSnapshot  } from "firebase/firestore";
import { db } from "./firebase";
import RosterView from './components/RosterView';

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

  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];

      setEmployees(employeesData);
    };

    fetchEmployees();
  }, []);


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
    const fetchAvailabilities = async () => {
      const querySnapshot = await getDocs(collection(db, "availabilities"));
      const data: Availability[] = querySnapshot.docs.map(docSnap => ({
        ...(docSnap.data() as Omit<Availability, "id">),
        id: docSnap.id,
      }));
      setAvailabilities(data);
    };

    fetchAvailabilities();
  }, []);


  // Roster fetch
  useEffect(() => {
    const fetchRoster = async () => {
      try {
  const rosterRef = collection(db, "rosters");

        const unsubscribe = onSnapshot(rosterRef, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRoster(data as RosterEntry[]);
        });

        // cleanup
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching roster:", error);
      }
    };
    fetchRoster();
  }, []);

  // Çalışan ekleme
  const addEmployee = async (employee: Omit<Employee, "id">) => {
    const docRef = await addDoc(collection(db, "employees"), employee);

    const newEmployee: Employee = {
      ...employee,
      id: docRef.id, // Firestore id
    };

    setEmployees(prev => [...prev, newEmployee]);
  };

  // Çalışan güncelleme
  const updateEmployee = async (id: string, employee: Omit<Employee, "id">) => {
    await updateDoc(doc(db, "employees", id), employee);

    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...employee, id } : emp))
    );
  };

  // Çalışan silme
  const deleteEmployee = async (id: string) => {
    await deleteDoc(doc(db, "employees", id));

    setEmployees(prev => prev.filter(emp => emp.id !== id));
    setAvailabilities(prev => prev.filter(avail => avail.employeeId !== id));
    setRoster(prev => prev.filter(entry => entry.employeeId !== id));
  };
  const addShift = async (shift: Omit<Shift, "id">) => {
    const docRef = await addDoc(collection(db, "shifts"), shift);

    const newShift: Shift = {
      ...shift,
      id: docRef.id, // Firestore’un verdiği gerçek id
    };

    setShifts(prev => [...prev, newShift]);
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

  const updateAvailability = async (
    employeeId: string,
    day: string,
    availability: Partial<Availability>
  ) => {
    try {
      // Unique docId (employeeId + day)
      const docId = `${employeeId}_${day}`;
      const ref = doc(db, "availabilities", docId);

      const newAvailability: Availability = {
        id: docId,
        employeeId,
        day,
        startTime: "00:01",
        endTime: "23:59",
        isAvailable: true,
        ...availability,
      };

      await setDoc(ref, newAvailability); // Firestore’a kaydet
      setAvailabilities(prev => {
        const existingIndex = prev.findIndex(a => a.id === docId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newAvailability;
          return updated;
        } else {
          return [...prev, newAvailability];
        }
      });
    } catch (error) {
      console.error("Error updating availability:", error);
    }
  };

  const generateRoster = async (roster: RosterEntry) => {
    const ref = doc(db, "rosters", roster.id); // id'yi kendimiz generate ediyorsak burada kullan
    await setDoc(ref, roster);
    setRoster(prev => {
      const existingIndex = prev.findIndex(r => r.id === roster.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = roster;
        return updated;
      } else {
        return [...prev, roster];
      }
    });
  };


  const tabs = [
    { id: 'employees', label: 'Staff', icon: Users },
    { id: 'shifts', label: 'Shifts', icon: Clock },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'roster', label: 'Magic Roster', icon: Zap },
    { id: 'weekly', label: 'Weekly View', icon: Calendar },
    { id: 'rosterView', label: 'Roster View', icon: View },
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
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${isActive
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
        {activeTab === 'rosterView' && (
          <RosterView
            employees={employees}
            roster={roster}
          />
        )}
      </main>
    </div>
  );
}

export default App;