"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import AddSubjectForm from "../../../teacher/subjects/_components/AddSubjectForm";

export default function AddSubjectPanel() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#1D4ED8] hover:bg-[#1e40af] text-white text-sm font-bold transition-colors flex-shrink-0"
      >
        <Plus className="h-4 w-4" /> Add Subject
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E6E4DE] shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#0f172a]">New Subject</h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">Add a BECE or WASSCE subject to the curriculum</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-8 w-8 rounded-lg hover:bg-[#F2F1EE] flex items-center justify-center text-[#64748B] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <AddSubjectForm onSuccess={() => setOpen(false)} />
    </div>
  );
}
