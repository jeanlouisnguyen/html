"use client";

import React from "react"

import { useState } from "react";
import { useSettings, type CustomCircle, type CustomPriority, type Category } from "@/lib/settings-store";
import { ArrowLeft, Plus, Trash2, ChevronRight, GripVertical, CornerDownRight } from "lucide-react";
import { resolveIcon } from "@/components/icon-picker";
import IconPicker from "@/components/icon-picker";
import ColorPicker from "@/components/color-picker";

interface SettingsViewProps {
  onClose: () => void;
}

function genId() {
  return Math.random().toString(36).slice(2, 8);
}

/* ---- Toggle row ---- */
function ToggleRow({ label, description, value, onChange }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b py-3" style={{ borderColor: "#eee" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: "#1a1e2e" }}>{label}</p>
        {description && <p className="mt-0.5 text-xs" style={{ color: "#999" }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{ background: value ? "#1a1e2e" : "#d4d4d4" }}
        role="switch" aria-checked={value}
      >
        <span className="absolute top-0.5 h-5 w-5 rounded-full shadow transition-transform" style={{
          background: "#fff",
          transform: value ? "translateX(22px)" : "translateX(2px)",
        }} />
      </button>
    </div>
  );
}

/* ---- Section header ---- */
function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#999" }}>{title}</h2>
      {onAdd && (
        <button onClick={onAdd} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "#f0f0f0" }}>
          <Plus className="h-3.5 w-3.5" style={{ color: "#1a1e2e" }} />
        </button>
      )}
    </div>
  );
}

/* ========== Circle editor row ========== */
function CircleRow({ circle, onUpdate, onDelete, onPickIcon, onPickColor }: {
  circle: CustomCircle;
  onUpdate: (patch: Partial<CustomCircle>) => void;
  onDelete: () => void;
  onPickIcon: () => void;
  onPickColor: () => void;
}) {
  const Icon = resolveIcon(circle.icon);
  return (
    <div className="flex items-center gap-2 border-b py-2.5" style={{ borderColor: "#eee" }}>
      <GripVertical className="h-3 w-3 flex-shrink-0" style={{ color: "#ccc" }} />
      {/* Color swatch */}
      <div onClick={onPickColor} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onPickColor(); }}
        className="flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
        style={{ background: circle.color, boxShadow: `0 1px 0 0 ${circle.color}88` }}>
        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
      </div>
      {/* Name */}
      <input
        className="flex-1 text-sm font-medium outline-none"
        style={{ color: "#1a1e2e", background: "transparent" }}
        value={circle.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <button onClick={onPickIcon} className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "#f5f5f5", color: "#888" }}>
        icon
      </button>
      <button onClick={onPickColor} className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "#f5f5f5", color: "#888" }}>
        color
      </button>
      <button onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: "#ef4444" }}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ========== Priority editor row ========== */
function PriorityRow({ prio, onUpdate, onDelete, onPickIcon, onPickColor }: {
  prio: CustomPriority;
  onUpdate: (patch: Partial<CustomPriority>) => void;
  onDelete: () => void;
  onPickIcon: () => void;
  onPickColor: () => void;
}) {
  const Icon = resolveIcon(prio.icon);
  return (
    <div className="flex items-center gap-2 border-b py-2.5" style={{ borderColor: "#eee" }}>
      <GripVertical className="h-3 w-3 flex-shrink-0" style={{ color: "#ccc" }} />
      <button onClick={onPickColor} className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded"
        style={{ background: prio.color }}>
        <Icon className="h-3 w-3 text-white" strokeWidth={2.5} />
      </button>
      <input
        className="flex-1 text-sm font-medium outline-none"
        style={{ color: "#1a1e2e", background: "transparent" }}
        value={prio.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      <label className="flex items-center gap-1 text-[9px]" style={{ color: "#888" }}>
        flash
        <input type="checkbox" checked={!!prio.animated} onChange={(e) => onUpdate({ animated: e.target.checked })} />
      </label>
      <button onClick={onPickIcon} className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "#f5f5f5", color: "#888" }}>
        icon
      </button>
      <button onClick={onPickColor} className="px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ background: "#f5f5f5", color: "#888" }}>
        color
      </button>
      <button onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: "#ef4444" }}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ========== Category editor row ========== */
function CategoryRow({ cat, allCats, onUpdate, onDelete }: {
  cat: Category;
  allCats: Category[];
  onUpdate: (patch: Partial<Category>) => void;
  onDelete: () => void;
}) {
  const isChild = !!cat.parentId;
  const parents = allCats.filter((c) => !c.parentId && c.id !== cat.id);
  const EmojiIcon = resolveIcon(cat.emoji);

  return (
    <div className="flex items-center gap-2 border-b py-2.5" style={{ borderColor: "#eee", paddingLeft: isChild ? 24 : 0 }}>
      {isChild && <CornerDownRight className="h-3 w-3 flex-shrink-0" style={{ color: "#ccc" }} />}
      {!isChild && <GripVertical className="h-3 w-3 flex-shrink-0" style={{ color: "#ccc" }} />}
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded" style={{ background: "#f5f5f5" }}>
        <EmojiIcon className="h-3.5 w-3.5" style={{ color: "#888" }} />
      </div>
      <input
        className="flex-1 text-sm font-medium outline-none"
        style={{ color: "#1a1e2e", background: "transparent" }}
        value={cat.label}
        onChange={(e) => onUpdate({ label: e.target.value })}
      />
      {/* Indent toggle */}
      <select
        className="rounded px-1 py-0.5 text-[9px]"
        style={{ background: "#f5f5f5", color: "#888", border: "none" }}
        value={cat.parentId || ""}
        onChange={(e) => onUpdate({ parentId: e.target.value || undefined })}
      >
        <option value="">Top level</option>
        {parents.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
      <button onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: "#ef4444" }}>
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

/* ========== MAIN SETTINGS VIEW ========== */
export default function SettingsView({ onClose }: SettingsViewProps) {
  const { settings, updateSettings } = useSettings();

  /* Picker state */
  const [iconPicker, setIconPicker] = useState<{ target: string; currentValue: string } | null>(null);
  const [colorPicker, setColorPicker] = useState<{ target: string; currentValue: string } | null>(null);

  /* Escape closes settings (pickers close first if one is open) */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (iconPicker) setIconPicker(null);
      else if (colorPicker) setColorPicker(null);
      else onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [iconPicker, colorPicker, onClose]);

  /* Expanded section */
  const [expanded, setExpanded] = useState<string | null>(null);
  const toggle = (s: string) => setExpanded(expanded === s ? null : s);

  /* ---- Circle CRUD ---- */
  const updateCircle = (id: string, patch: Partial<CustomCircle>) => {
    updateSettings({ circles: settings.circles.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };
  const addCircle = () => {
    updateSettings({ circles: [...settings.circles, { id: genId(), label: "New Circle", icon: "Circle", color: "#6b7280" }] });
  };
  const deleteCircle = (id: string) => {
    updateSettings({ circles: settings.circles.filter((c) => c.id !== id) });
  };

  /* ---- Priority CRUD ---- */
  const updatePriority = (id: string, patch: Partial<CustomPriority>) => {
    updateSettings({ priorities: settings.priorities.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };
  const addPriority = () => {
    const rank = settings.priorities.length;
    updateSettings({ priorities: [...settings.priorities, { id: genId(), label: "New Level", icon: "Circle", color: "#6b7280", rank }] });
  };
  const deletePriority = (id: string) => {
    updateSettings({ priorities: settings.priorities.filter((p) => p.id !== id) });
  };

  /* ---- Category CRUD factory ---- */
  const catCRUD = (key: "expenseCategories" | "incomeCategories" | "passwordCategories") => ({
    update: (id: string, patch: Partial<Category>) => {
      updateSettings({ [key]: settings[key].map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    },
    add: () => {
      updateSettings({ [key]: [...settings[key], { id: genId(), label: "New Category", emoji: "circle" }] });
    },
    del: (id: string) => {
      updateSettings({ [key]: settings[key].filter((c) => c.id !== id) });
    },
  });
  const expCrud = catCRUD("expenseCategories");
  const incCrud = catCRUD("incomeCategories");
  const pwCrud = catCRUD("passwordCategories");

  /* ---- icon/color pick resolution ---- */
  const handleIconChange = (iconName: string) => {
    if (!iconPicker) return;
    const [kind, id] = iconPicker.target.split("::");
    if (kind === "circle") updateCircle(id, { icon: iconName });
    else if (kind === "priority") updatePriority(id, { icon: iconName });
    else if (kind === "expense") expCrud.update(id, { emoji: iconName });
    else if (kind === "income") incCrud.update(id, { emoji: iconName });
    else if (kind === "password") pwCrud.update(id, { emoji: iconName });
  };

  const handleColorChange = (color: string) => {
    if (!colorPicker) return;
    const [kind, id] = colorPicker.target.split("::");
    if (kind === "circle") updateCircle(id, { color });
    else if (kind === "priority") updatePriority(id, { color });
  };

  /* Collapsible section wrapper -- uses div not button to avoid nesting issue */
  const Section = ({ id, title, onAdd, children }: { id: string; title: string; onAdd: () => void; children: React.ReactNode }) => {
    const isOpen = expanded === id;
    return (
      <div className="mt-4">
        <div className="flex w-full items-center justify-between py-2">
          <div className="flex-1 cursor-pointer" role="button" tabIndex={0}
            onClick={() => toggle(id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(id); }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#999" }}>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span role="button" tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded"
              style={{ background: "#f0f0f0" }}>
              <Plus className="h-3 w-3" style={{ color: "#1a1e2e" }} />
            </span>
            <ChevronRight className="h-3.5 w-3.5 cursor-pointer transition-transform"
              onClick={() => toggle(id)}
              style={{ color: "#999", transform: isOpen ? "rotate(90deg)" : "none" }} />
          </div>
        </div>
        {isOpen && <div>{children}</div>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "#ffffff" }}>
      {/* Header */}
      <header className="flex h-12 flex-shrink-0 items-center border-b px-4" style={{ borderColor: "#eee" }}>
        <button onClick={onClose} className="flex items-center gap-1 text-sm" style={{ color: "#888" }}>
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <h1 className="ml-4 text-sm font-bold" style={{ color: "#1a1e2e" }}>Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-20">
        {/* ---- Calendar ---- */}
        <SectionHeader title="Calendar" />
        <ToggleRow label="ISO Week Numbers" description="Show week numbers on the left" value={settings.isoWeekNumbers}
          onChange={(v) => updateSettings({ isoWeekNumbers: v })} />
        <ToggleRow label="Julian Day Numbers" description="Show day-of-year numbers" value={settings.julianDayNumbers}
          onChange={(v) => updateSettings({ julianDayNumbers: v })} />
        <div className="flex items-center justify-between border-b py-3" style={{ borderColor: "#eee" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "#1a1e2e" }}>Week Start</p>
            <p className="mt-0.5 text-xs" style={{ color: "#999" }}>First day of the week</p>
          </div>
          <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "#ddd" }}>
            {[{ v: true, label: "Mon" }, { v: false, label: "Sun" }].map(({ v, label }) => (
              <button key={label} onClick={() => updateSettings({ weekStartMonday: v })}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: settings.weekStartMonday === v ? "#1a1e2e" : "transparent", color: settings.weekStartMonday === v ? "#fff" : "#999" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow label="Holidays" description="Canadian federal + Quebec statutory" value={settings.showHolidays}
          onChange={(v) => updateSettings({ showHolidays: v })} />

        {/* ---- Circles ---- */}
        <Section id="circles" title="Circles" onAdd={addCircle}>
          {settings.circles.map((c) => (
            <CircleRow key={c.id} circle={c}
              onUpdate={(p) => updateCircle(c.id, p)}
              onDelete={() => deleteCircle(c.id)}
              onPickIcon={() => setIconPicker({ target: `circle::${c.id}`, currentValue: c.icon })}
              onPickColor={() => setColorPicker({ target: `circle::${c.id}`, currentValue: c.color })}
            />
          ))}
        </Section>

        {/* ---- Priorities ---- */}
        <Section id="priorities" title="Priority Levels" onAdd={addPriority}>
          {settings.priorities
            .sort((a, b) => a.rank - b.rank)
            .map((p) => (
              <PriorityRow key={p.id} prio={p}
                onUpdate={(patch) => updatePriority(p.id, patch)}
                onDelete={() => deletePriority(p.id)}
                onPickIcon={() => setIconPicker({ target: `priority::${p.id}`, currentValue: p.icon })}
                onPickColor={() => setColorPicker({ target: `priority::${p.id}`, currentValue: p.color })}
              />
            ))}
        </Section>

        {/* ---- Expense Categories ---- */}
        <Section id="expenses" title="Expense Categories" onAdd={expCrud.add}>
          {settings.expenseCategories.map((c) => (
            <CategoryRow key={c.id} cat={c} allCats={settings.expenseCategories}
              onUpdate={(p) => expCrud.update(c.id, p)} onDelete={() => expCrud.del(c.id)} />
          ))}
        </Section>

        {/* ---- Income Categories ---- */}
        <Section id="income" title="Income Categories" onAdd={incCrud.add}>
          {settings.incomeCategories.map((c) => (
            <CategoryRow key={c.id} cat={c} allCats={settings.incomeCategories}
              onUpdate={(p) => incCrud.update(c.id, p)} onDelete={() => incCrud.del(c.id)} />
          ))}
        </Section>

        {/* ---- Password Categories ---- */}
        <Section id="passwords" title="Password Categories" onAdd={pwCrud.add}>
          {settings.passwordCategories.map((c) => (
            <CategoryRow key={c.id} cat={c} allCats={settings.passwordCategories}
              onUpdate={(p) => pwCrud.update(c.id, p)} onDelete={() => pwCrud.del(c.id)} />
          ))}
        </Section>

        {/* About */}
        <div className="mt-6 border-b py-3" style={{ borderColor: "#eee" }}>
          <p className="text-sm font-medium" style={{ color: "#1a1e2e" }}>Pock-it!</p>
          <p className="mt-0.5 text-xs" style={{ color: "#999" }}>Version 1.0.0</p>
        </div>
      </div>

      {/* Pickers */}
      {iconPicker && (
        <IconPicker
          value={iconPicker.currentValue}
          onChange={handleIconChange}
          onClose={() => setIconPicker(null)}
        />
      )}
      {colorPicker && (
        <ColorPicker
          value={colorPicker.currentValue}
          onChange={handleColorChange}
          onClose={() => setColorPicker(null)}
        />
      )}
    </div>
  );
}
