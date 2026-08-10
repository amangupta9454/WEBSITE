import React, { useState, useEffect } from "react";
import axios from "axios";
import { Settings2, Save, ChevronDown, CheckCircle2, AlertCircle, Loader2, Clock, Target, HelpCircle, Timer } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL || "";

export default function SimpleConfigManager() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    totalQuestions: 20,
    timeLimitMinutes: 30,
    passingPercentage: 70,
    questionTimerSeconds: 60,
    allowReview: true,
    allowPrevious: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [allConfigs, setAllConfigs] = useState([]);

  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    // Load categories list
    axios.get(`${API}/api/admin/assessment/categories?limit=100`, { headers })
      .then(r => setCategories(r.data?.data || []))
      .catch(() => {});
    // Load subcategories list
    axios.get(`${API}/api/admin/assessment/subcategories?limit=500`, { headers })
      .then(r => setSubcategories(r.data?.data || []))
      .catch(() => {});
    // Load all configs for the summary table
    axios.get(`${API}/api/admin/assessment/configs`, { headers })
      .then(r => setAllConfigs(r.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSubcategory) { setConfig(null); return; }
    fetchConfig();
  }, [selectedSubcategory]);

  const fetchConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await axios.get(`${API}/api/admin/assessment/configs/${selectedSubcategory}`, { headers });
      const c = r.data?.data;
      if (c) {
        setConfig(c);
        setForm({
          totalQuestions: c.totalQuestions || 20,
          timeLimitMinutes: c.timeLimitMinutes || 30,
          passingPercentage: c.passingPercentage || 70,
          questionTimerSeconds: c.questionTimerSeconds ?? 60,
          allowReview: c.allowReview !== false,
          allowPrevious: c.allowPrevious !== false,
        });
      } else {
        setConfig(null);
        setForm({ totalQuestions: 20, timeLimitMinutes: 30, passingPercentage: 70, questionTimerSeconds: 60, allowReview: true, allowPrevious: true });
      }
    } catch {
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedSubcategory) return;
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const totalQ = Number(form.totalQuestions);
      const easy = Math.round(totalQ * 0.30);
      const medium = Math.round(totalQ * 0.40);
      const hard = Math.round(totalQ * 0.20);
      const expert = totalQ - (easy + medium + hard);

      await axios.put(`${API}/api/admin/assessment/configs/${selectedSubcategory}`, {
        totalQuestions: totalQ,
        timeLimitMinutes: Number(form.timeLimitMinutes),
        passingPercentage: Number(form.passingPercentage),
        questionTimerSeconds: Number(form.questionTimerSeconds),
        difficultyDistribution: { easy, medium, hard, expert },
        allowReview: form.allowReview,
        allowPrevious: form.allowPrevious,
        isActive: true,
      }, { headers });
      setSuccess("Configuration saved successfully!");
      // Refresh all configs table
      const r = await axios.get(`${API}/api/admin/assessment/configs`, { headers });
      setAllConfigs(r.data?.data || []);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const subName = subcategories.find(s => s._id === selectedSubcategory)?.name || "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Assessment Configuration</h2>
            <p className="text-sm text-slate-500">Set total questions, time limit, passing percentage & timer per subcategory</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Subcategory Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Category</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={e => { setSelectedCategory(e.target.value); setSelectedSubcategory(""); }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Subcategory</label>
              <div className="relative">
                <select
                  value={selectedSubcategory}
                  onChange={e => setSelectedSubcategory(e.target.value)}
                  disabled={!selectedCategory}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8 disabled:opacity-50"
                >
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.filter(s => s.categoryId === selectedCategory || s.categoryId?._id === selectedCategory).map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Reference</h4>
            {[
              { icon: HelpCircle, label: "Recommended Questions", value: "20" },
              { icon: Clock, label: "Recommended Time", value: "30 min" },
              { icon: Target, label: "Recommended Pass %", value: "70%" },
              { icon: Timer, label: "Per-Question Timer", value: "60 sec" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <span className="text-xs font-bold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Config Form */}
        <div className="lg:col-span-2">
          {!selectedSubcategory ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Settings2 className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-medium">Select a subcategory to configure</p>
            </div>
          ) : loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 flex items-center justify-center gap-3 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="text-slate-500 font-medium">Loading configuration...</span>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">
                  Config for: <span className="text-violet-600">{subName}</span>
                </h3>
                {!config && (
                  <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-md">New Config</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Total Questions */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min={5} max={100}
                    value={form.totalQuestions}
                    onChange={e => setForm(p => ({ ...p, totalQuestions: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-xs text-slate-400">Min: 5 | Max: 100</p>
                </div>

                {/* Time Limit */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min={5} max={180}
                    value={form.timeLimitMinutes}
                    onChange={e => setForm(p => ({ ...p, timeLimitMinutes: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-xs text-slate-400">Total session duration</p>
                </div>

                {/* Passing Percentage */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Passing Percentage: <span className="text-violet-600">{form.passingPercentage}%</span>
                  </label>
                  <input
                    type="range"
                    min={10} max={100} step={5}
                    value={form.passingPercentage}
                    onChange={e => setForm(p => ({ ...p, passingPercentage: Number(e.target.value) }))}
                    className="w-full accent-violet-600 h-2"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>10%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                {/* Per-Question Timer */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Per-Question Timer (seconds)
                  </label>
                  <div className="flex items-center gap-2">
                    {[0, 7, 15, 30, 60].map(s => (
                      <button
                        key={s}
                        onClick={() => setForm(p => ({ ...p, questionTimerSeconds: s }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${form.questionTimerSeconds === s ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      >
                        {s === 0 ? "Off" : `${s}s`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">0 = disabled, 60s recommended</p>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {[
                  { key: "allowReview", label: "Allow Review", desc: "Students can review answers before submit" },
                  { key: "allowPrevious", label: "Allow Previous", desc: "Students can go to previous questions" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start gap-3">
                    <button
                      onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                      className={`mt-0.5 w-11 h-6 rounded-full transition-all shrink-0 relative ${form[key] ? "bg-violet-600" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form[key] ? "left-5" : "left-0.5"}`} />
                    </button>
                    <div>
                      <div className="text-sm font-bold text-slate-700">{label}</div>
                      <div className="text-xs text-slate-400">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              {success && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-violet-200"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Configuration</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* All Configs Summary Table */}
      {allConfigs.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">All Subcategory Configurations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Subcategory</th>
                  <th className="px-6 py-3 text-center font-bold">Questions</th>
                  <th className="px-6 py-3 text-center font-bold">Time (min)</th>
                  <th className="px-6 py-3 text-center font-bold">Pass %</th>
                  <th className="px-6 py-3 text-center font-bold">Q. Timer</th>
                  <th className="px-6 py-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allConfigs.map(c => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-800">
                      {subcategories.find(s => s._id === (c.subcategoryId?._id || c.subcategoryId))?.name || c.subcategoryId?.name || "—"}
                    </td>
                    <td className="px-6 py-3 text-center text-slate-600">{c.totalQuestions || 20}</td>
                    <td className="px-6 py-3 text-center text-slate-600">{c.timeLimitMinutes || 30}</td>
                    <td className="px-6 py-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-bold text-xs">{c.passingPercentage || 70}%</span>
                    </td>
                    <td className="px-6 py-3 text-center text-slate-600">
                      {c.questionTimerSeconds ? `${c.questionTimerSeconds}s` : "Off"}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
