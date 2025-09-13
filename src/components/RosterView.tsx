import React from "react";
import { Employee, RosterEntry } from "../types";
import { differenceInHours, parse } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Props {
    employees: Employee[];
    roster: RosterEntry[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function RosterView({ employees, roster }: Props) {
    const getHours = (entry: RosterEntry) => {
        const start = parse(entry.startTime, "HH:mm", new Date());
        const end = parse(entry.endTime, "HH:mm", new Date());
        return differenceInHours(end, start);
    };

    const calculateTotals = (empId: string) => {
        let monSat = 0;
        let sunday = 0;

        roster
            .filter(r => r.employeeId === empId)
            .forEach(entry => {
                let hours = getHours(entry);
                if (hours > 8) hours = hours - 0.5; // 8 saat üzeri için break düş
                else hours = hours - 0.25; // 8 saat alti için break düş
                if (entry.day === "Sunday") {
                    sunday += hours;
                } else {
                    monSat += hours;
                }
            });

        return { monSat, sunday };
    };
    const exportToExcel = () => {
        // Başlık satırını oluştur
        const header = ["Employee", ...DAYS, "Mon-Sat Hours", "Sunday Hours"];

        // Veri satırlarını oluştur
        const data = employees.map(emp => {
            const t = calculateTotals(emp.id);
            const row = [
                `${emp.name} (${emp.position})`,
                ...DAYS.map(day => getShiftFor(emp.id, day) || "-"),
                t.monSat,
                t.sunday,
            ];
            return row;
        });

        // Excel sheet oluştur
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Roster");

        // Dosya olarak indir
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "roster.xlsx");
    };
    const getShiftFor = (empId: string, day: string) => {
        return roster
            .filter(r => r.employeeId === empId && r.day === day)
            .map(r => `${r.startTime}-${r.endTime}`)
            .join(", ");
    };

    // --- GRAND TOTAL hesaplama ---
    const grandTotalByDay = (day: string) => {
        return roster
            .filter(r => r.day === day)
            .reduce((sum, r) => sum + getHours(r), 0);
    };

    const grandTotals = () => {
        let monSat = 0;
        let sunday = 0;
        roster.forEach(r => {
            const hours = getHours(r);
            if (r.day === "Sunday") {
                sunday += hours;
            } else {
                monSat += hours;
            }
        });
        return { monSat, sunday };
    };

    const totals = grandTotals();

    return (
        <div className="overflow-x-auto">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-purple-200 bg-white/50">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Export to Excel</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={exportToExcel}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                        >Go!
                        </button>
                    </div>
                </div>
            </div>
            <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border">Employee</th>
                        {DAYS.map(day => (
                            <th key={day} className="p-2 border text-center">{day}</th>
                        ))}
                        <th className="p-2 border text-center">Total (Mon–Sat)</th>
                        <th className="p-2 border text-center">Sunday</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.sort((a, b) => a.position.localeCompare(b.position)).map(emp => {
                        const t = calculateTotals(emp.id);
                        return (
                            <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="p-2 border font-medium">{emp.name}</td>
                                {DAYS.map(day => (
                                    <td key={day} className="p-2 border text-center">
                                        {getShiftFor(emp.id, day) || "OFF"}
                                    </td>
                                ))}
                                <td className="p-2 border text-center">{(t.monSat).toFixed(2)}</td>
                                <td className="p-2 border text-center">{(t.sunday).toFixed(2)}</td>
                            </tr>
                        );
                    })}

                    {/* --- GRAND TOTAL ROW --- */}
                    <tr className="bg-gray-200 font-semibold">
                        <td className="p-2 border text-right">Grand Total</td>
                        {DAYS.map(day => (
                            <td key={day} className="p-2 border text-center">
                                {grandTotalByDay(day)}
                            </td>
                        ))}
                        <td className="p-2 border text-center">{(totals.monSat).toFixed(2)}</td>
                        <td className="p-2 border text-center">{(totals.sunday).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

