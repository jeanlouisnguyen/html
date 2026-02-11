"use client";

import { useState } from "react";
import type { Thing, ThingType, Circle, Priority, ListItem } from "@/lib/types";
import {
  TYPE_ICONS,
  CIRCLE_ICONS,
  CIRCLE_STICKER_COLORS,
  getCardBg,
  getCardTextColor,
  getPrioritySticker,
} from "@/lib/card-helpers";
import {
  ArrowLeft,
  Trash2,
  X,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";

interface ThingEditViewProps {
  thing: Thing;
  onSave: (updates: Partial<Thing>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ThingEditView({ thing, onSave, onDelete, onClose }: ThingEditViewProps) {
  const [draft, setDraft] = useState<Thing>({ ...thing });
  const [activePopup, setActivePopup] = useState<"circle" | "priority" | "type" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const bg = getCardBg(draft);
  const textColor = getCardTextColor(bg);
  const TypeIcon = TYPE_ICONS[draft.type];

  const isExpense = draft.type === "expense" || draft.type === "subscription";
  const isBirthday = draft.type === "birthday";

  const patch = (p: Partial<Thing>) => setDraft((d) => ({ ...d, ...p }));
  const handleSave = () => { onSave(draft); onClose(); };

  const togglePopup = (p: "circle" | "priority" | "type") =>
    setActivePopup((cur) => (cur === p ? null : p));

  const allTypes = Object.keys(TYPE_ICONS) as ThingType[];
  const allCircles = Object.keys(CIRCLE_ICONS) as Circle[];
  const allPriorities: Priority[] = ["low", "medium", "high", "urgent"];

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Header -- simplified: Back + Delete + Save */}
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border px-4">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onDelete} className="p-2 text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={handleSave}
            className="rounded px-3 py-1 text-sm font-bold"
            style={{ background: "#1a1e2e", color: "#fff" }}>
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4" onClick={() => setActivePopup(null)}>
        {/* ---- EXPANDED STICKY NOTE CARD ---- */}
        <div className="relative overflow-visible" onClick={(e) => e.stopPropagation()}
          style={{
            background: bg, color: textColor, borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)",
            padding: "14px 14px 48px 14px",
          }}>

          {/* PIN (top center) -- real pin if pinned, ghost dashed circle if not */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -6 }}>
            <button onClick={() => patch({ pinned: !draft.pinned })} className="relative flex flex-col items-center">
              {draft.pinned ? (
                <>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
                  }}>
                    <div style={{
                      position: "absolute", top: 3, left: 4,
                      width: 4, height: 3, borderRadius: "50%",
                      background: "rgba(255,255,255,0.35)",
                    }} />
                  </div>
                  <div style={{ width: 2, height: 5, background: "#888", margin: "0 auto", borderRadius: 1 }} />
                </>
              ) : (
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px dashed rgba(0,0,0,0.12)",
                }} />
              )}
            </button>
          </div>

          {/* TOP ROW: Circle (left) + Priority (right) */}
          <div className="mt-2 flex items-start justify-between">
            <div className="relative">
              <button onClick={() => togglePopup("circle")}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={draft.circle ? {
                  background: CIRCLE_STICKER_COLORS[draft.circle].bg,
                  boxShadow: `0 2px 0 0 ${CIRCLE_STICKER_COLORS[draft.circle].shadow}, 0 2px 6px rgba(0,0,0,0.18)`,
                } : { border: "2px dashed rgba(0,0,0,0.12)" }}>
                {draft.circle ? (
                  (() => { const CI = CIRCLE_ICONS[draft.circle]; return <CI className="h-4 w-4 text-white" strokeWidth={2.5} />; })()
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: "rgba(0,0,0,0.25)" }}>@</span>
                )}
              </button>
              {activePopup === "circle" && (
                <div className="absolute left-0 top-11 z-30 flex gap-1.5 rounded-lg border bg-white p-2 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                  <button onClick={() => { patch({ circle: undefined }); setActivePopup(null); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold" style={{ color: "#aaa" }}>--</button>
                  {allCircles.map((c) => {
                    const CI = CIRCLE_ICONS[c];
                    const col = CIRCLE_STICKER_COLORS[c];
                    return (
                      <button key={c} onClick={() => { patch({ circle: c }); setActivePopup(null); }}
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ background: col.bg, boxShadow: `0 1px 0 0 ${col.shadow}` }}>
                        <CI className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => togglePopup("priority")}
                className={`flex h-8 w-8 items-center justify-center ${getPrioritySticker(draft.priority).animated ? "animate-urgent-flash" : ""}`}
                style={{ background: getPrioritySticker(draft.priority).bg, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                <span className="text-xs font-bold text-white">
                  {draft.priority === "urgent" ? "!!" : draft.priority === "high" ? "!" : draft.priority === "medium" ? "-" : ""}
                </span>
              </button>
              {activePopup === "priority" && (
                <div className="absolute right-0 top-10 z-30 flex gap-1.5 rounded-lg border bg-white p-2 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                  {allPriorities.map((p) => {
                    const s = getPrioritySticker(p);
                    return (
                      <button key={p} onClick={() => { patch({ priority: p }); setActivePopup(null); }}
                        className={`flex h-7 w-7 items-center justify-center ${draft.priority === p ? "ring-2 ring-black/20" : ""}`}
                        style={{ background: s.bg, borderRadius: 3 }}>
                        <span className="text-[10px] font-bold text-white">
                          {p === "urgent" ? "!!" : p === "high" ? "!" : p === "medium" ? "-" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ---- TITLE ---- */}
          <div className="mt-3">
            <input className="w-full bg-transparent text-xl font-bold outline-none placeholder:opacity-30"
              style={{ color: textColor }}
              value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Title..." />
          </div>

          {/* ---- TYPE-SPECIFIC FIELDS ---- */}
          <div className="mt-3 space-y-2.5">
            {isBirthday && (
              <input className="w-full bg-transparent text-base font-semibold outline-none placeholder:opacity-40"
                style={{ color: textColor }} placeholder="Person's name"
                value={draft.birthdayPerson || ""} onChange={(e) => patch({ birthdayPerson: e.target.value })} />
            )}
            {isBirthday && draft.eventDate && (
              <p className="text-2xl font-black tabular-nums" style={{ color: textColor }}>
                {new Date(draft.eventDate + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </p>
            )}
            {isExpense && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: textColor }}>$</span>
                <input className="w-40 bg-transparent font-mono text-2xl font-black outline-none placeholder:opacity-30"
                  style={{ color: textColor }} type="number" step="0.01" placeholder="0.00"
                  value={draft.amount ?? ""} onChange={(e) => patch({ amount: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            )}
            {isExpense && (
              <input className="w-full bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                placeholder="Vendor" value={draft.vendor || ""} onChange={(e) => patch({ vendor: e.target.value })} />
            )}
            {draft.type === "bookmark" && (
              <input className="w-full bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                placeholder="https://..." value={draft.url || ""} onChange={(e) => patch({ url: e.target.value })} />
            )}
            {draft.type === "password" && (
              <>
                <div className="flex items-center gap-2">
                  <input className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                    placeholder="Username" value={draft.username || ""} onChange={(e) => patch({ username: e.target.value })} />
                  <button onClick={() => { if (draft.username) navigator.clipboard.writeText(draft.username); }}
                    className="opacity-30 hover:opacity-60"><Copy className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex items-center gap-2">
                  <input type={showPassword ? "text" : "password"}
                    className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                    placeholder="Password" value={draft.password || ""} onChange={(e) => patch({ password: e.target.value })} />
                  <button onClick={() => setShowPassword(!showPassword)} className="opacity-30 hover:opacity-60">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => { if (draft.password) navigator.clipboard.writeText(draft.password); }}
                    className="opacity-30 hover:opacity-60"><Copy className="h-3.5 w-3.5" /></button>
                </div>
              </>
            )}

            <textarea className="w-full bg-transparent text-sm leading-relaxed outline-none placeholder:opacity-40"
              style={{ color: textColor }} rows={3} placeholder="Description (optional)"
              value={draft.description || ""} onChange={(e) => patch({ description: e.target.value })} />

            {draft.type === "list" && (
              <div className="space-y-1.5">
                {(draft.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button onClick={() => {
                        const n = [...(draft.items || [])];
                        n[idx] = { ...n[idx], checked: !n[idx].checked };
                        patch({ items: n });
                      }}
                      className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border"
                      style={{ borderColor: "rgba(0,0,0,0.2)", background: item.checked ? "rgba(0,0,0,0.15)" : "transparent" }}>
                      {item.checked && <Check className="h-3 w-3" style={{ color: textColor, opacity: 0.6 }} />}
                    </button>
                    <input className={`flex-1 bg-transparent text-sm outline-none ${item.checked ? "line-through opacity-40" : ""}`}
                      style={{ color: textColor }} value={item.text}
                      onChange={(e) => {
                        const n = [...(draft.items || [])];
                        n[idx] = { ...n[idx], text: e.target.value };
                        patch({ items: n });
                      }} />
                    <button onClick={() => patch({ items: (draft.items || []).filter((_, i) => i !== idx) })}>
                      <X className="h-3 w-3 opacity-30" />
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                    const ni: ListItem = { id: Math.random().toString(36).slice(2, 8), text: "", checked: false };
                    patch({ items: [...(draft.items || []), ni] });
                  }}
                  className="flex items-center gap-1 text-xs opacity-50">
                  <Plus className="h-3 w-3" /> Add item
                </button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {draft.tags.map((tag, idx) => (
              <span key={tag} className="flex items-center gap-0.5 rounded-sm px-1 py-px text-[9px] font-medium"
                style={{ background: "rgba(0,0,0,0.06)" }}>
                #{tag}
                <button onClick={() => patch({ tags: draft.tags.filter((_, i) => i !== idx) })}>
                  <X className="h-2.5 w-2.5 opacity-40" />
                </button>
              </span>
            ))}
            <input className="w-16 bg-transparent text-[10px] outline-none placeholder:opacity-30" style={{ color: textColor }}
              placeholder="#tag" onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  patch({ tags: [...draft.tags, e.currentTarget.value.trim().replace(/^#/, "")] });
                  e.currentTarget.value = "";
                }
              }} />
          </div>

          {/* Dates */}
          <div className="mt-3 flex flex-wrap gap-3">
            {(draft.type === "event" || isBirthday) ? (
              <label className="flex items-center gap-1.5 text-[10px]" style={{ color: textColor, opacity: 0.5 }}>
                Event:
                <input type="date" className="bg-transparent text-[10px] outline-none" style={{ color: textColor }}
                  value={draft.eventDate || ""} onChange={(e) => patch({ eventDate: e.target.value || undefined })} />
              </label>
            ) : (
              <label className="flex items-center gap-1.5 text-[10px]" style={{ color: textColor, opacity: 0.5 }}>
                Due:
                <input type="date" className="bg-transparent text-[10px] outline-none" style={{ color: textColor }}
                  value={draft.dueDate || ""} onChange={(e) => patch({ dueDate: e.target.value || undefined })} />
              </label>
            )}
          </div>

          {/* Eisenhower quadrant (tasks only) */}
          {draft.type === "task" && (
            <div className="mt-3">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider opacity-40">Eisenhower</p>
              <div className="grid grid-cols-4 gap-1">
                {([
                  { key: "do", label: "Do", color: "#fee2e2", border: "#fca5a5" },
                  { key: "schedule", label: "Schedule", color: "#dbeafe", border: "#93c5fd" },
                  { key: "delegate", label: "Delegate", color: "#fef9c3", border: "#fde047" },
                  { key: "delete", label: "Eliminate", color: "#f3f4f6", border: "#d1d5db" },
                ] as const).map((q) => (
                  <button key={q.key} onClick={() => patch({ eisenhower: draft.eisenhower === q.key ? undefined : q.key })}
                    className="rounded px-1.5 py-1 text-[9px] font-bold transition-colors"
                    style={{
                      background: draft.eisenhower === q.key ? q.border : q.color,
                      color: "#333",
                      border: `1.5px solid ${draft.eisenhower === q.key ? "#333" : q.border}`,
                    }}>
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHECKBOX (lower-left) -- prominent, reflects completed state */}
          <div className="absolute bottom-2 left-3">
            <button onClick={() => patch({ completed: !draft.completed })}
              className="flex h-5 w-5 items-center justify-center rounded-sm border-2 transition-colors"
              style={{
                borderColor: draft.completed ? "#22c55e" : "rgba(0,0,0,0.15)",
                background: draft.completed ? "#22c55e" : "rgba(0,0,0,0.02)",
              }}>
              {draft.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            </button>
          </div>

          {/* TYPE ICON + LABEL (lower-right) -- tappable, expands grid picker */}
          <div className="absolute bottom-2 right-3 z-20">
            <button onClick={() => togglePopup("type")} className="flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{ background: "rgba(0,0,0,0.04)" }}>
              <TypeIcon className="h-4 w-4 opacity-40" />
              <span className="text-[8px] font-bold uppercase tracking-wider opacity-30">{draft.type}</span>
            </button>
            {activePopup === "type" && (
              <div className="absolute bottom-8 right-0 z-30 rounded-lg border bg-white p-2.5 shadow-xl"
                style={{ borderColor: "rgba(0,0,0,0.1)", width: 200 }}>
                <p className="mb-2 text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Change type</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {allTypes.map((t) => {
                    const TI = TYPE_ICONS[t];
                    const active = draft.type === t;
                    return (
                      <button key={t} onClick={() => { patch({ type: t }); setActivePopup(null); }}
                        className="flex flex-col items-center gap-0.5 rounded p-1.5 transition-colors"
                        style={{ background: active ? "#1a1e2e" : "#f5f5f4", color: active ? "#fff" : "#1a1e2e" }}>
                        <TI className="h-3.5 w-3.5" />
                        <span className="text-[6px] font-bold leading-none">{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
