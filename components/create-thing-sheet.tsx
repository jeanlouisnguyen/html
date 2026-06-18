"use client";

import { useState, useEffect, useRef } from "react";
import type { Thing, ThingType, Circle, Priority, ListItem, Recurrence } from "@/lib/types";
import {
  TYPE_ICONS,
  CIRCLE_ICONS,
  CIRCLE_STICKER_COLORS,
  DUE_DATE_REQUIRED,
  MEDIA_TYPES,
  getCardBg,
  getCardTextColor,
  getPrioritySticker,
} from "@/lib/card-helpers";
import { fetchBookmarkMeta } from "@/lib/media-search";
import { generatePassphrase } from "@/lib/password-strength";
import { faviconFor, type SiteSuggestion } from "@/lib/website-suggestions";
import PasswordStrengthMeter from "./password-strength-meter";
import WebsiteAutocomplete from "./website-autocomplete";
import MediaSearchField from "./media-search-field";
import RecurrenceSection from "./recurrence-section";
import { X, Plus, Eye, EyeOff, Wand2, Loader2 } from "lucide-react";

interface CreateSheetProps {
  onSave: (t: Omit<Thing, "id" | "createdAt">) => void;
  onClose: () => void;
  defaultType?: ThingType;
  prefillDate?: string;
  prefillStartTime?: string;
}

export default function CreateThingSheet({ onSave, onClose, defaultType, prefillDate, prefillStartTime }: CreateSheetProps) {
  const [type, setType] = useState<ThingType>(defaultType || "task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [circle, setCircle] = useState<Circle | undefined>();
  const [priority, setPriority] = useState<Priority>("medium");
  const [pinned, setPinned] = useState(false);
  const [dueDate, setDueDate] = useState(prefillDate || "");
  const [eventDate, setEventDate] = useState(
    (defaultType === "event" || defaultType === "birthday") ? (prefillDate || "") : ""
  );
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [startTime, setStartTime] = useState(prefillStartTime || "");
  const [birthdayPerson, setBirthdayPerson] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>();

  // media + bookmark metadata
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [creator, setCreator] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>();
  const [siteName, setSiteName] = useState<string | undefined>();
  const [mediaQuery, setMediaQuery] = useState("");
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [activePopup, setActivePopup] = useState<"circle" | "priority" | "type" | null>(null);

  const allTypes = Object.keys(TYPE_ICONS) as ThingType[];
  const allCircles = Object.keys(CIRCLE_ICONS) as Circle[];
  const allPriorities: Priority[] = ["low", "medium", "high", "urgent"];

  const switchType = (newType: ThingType) => {
    setType(newType);
    setActivePopup(null);
  };
  const togglePopup = (p: "circle" | "priority" | "type") =>
    setActivePopup((cur) => (cur === p ? null : p));

  const isExpense = type === "expense" || type === "subscription";
  const isBirthday = type === "birthday";
  const isPassword = type === "password";
  const isBookmark = type === "bookmark";
  const isMedia = MEDIA_TYPES.includes(type);
  const usesEventDate = type === "event" || isBirthday;
  const relevantDate = usesEventDate ? eventDate : dueDate;
  const dueRequired = DUE_DATE_REQUIRED.includes(type);
  const showRecurrence = !!relevantDate && type !== "birthday";

  const fakeThing = { type, dueDate, eventDate, completed: false, coverImage } as Thing;
  const bg = getCardBg(fakeThing);
  const textColor = getCardTextColor(bg);
  const TypeIcon = TYPE_ICONS[type];
  const isTitleMissing = !title.trim();
  const isDateMissing = dueRequired && !relevantDate;
  const canSave = !isTitleMissing && !isDateMissing;

  // Auto-fetch bookmark metadata (debounced)
  const bookmarkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isBookmark) return;
    const u = url.trim();
    if (u.length < 4 || !u.includes(".")) return;
    if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current);
    bookmarkTimer.current = setTimeout(async () => {
      setBookmarkLoading(true);
      try {
        const meta = await fetchBookmarkMeta(u);
        setFaviconUrl(meta.favicon);
        setSiteName(meta.siteName);
        if (meta.image) setCoverImage(meta.image);
        setTitle((cur) => (cur.trim() ? cur : meta.title || meta.siteName || cur));
      } finally {
        setBookmarkLoading(false);
      }
    }, 700);
    return () => { if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current); };
  }, [url, isBookmark]);

  const handlePickSite = (s: SiteSuggestion) => {
    setUrl(`https://${s.domain}`);
    setFaviconUrl(faviconFor(s.domain, 128));
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(), type, circle, priority,
      pinned, completed: false, tags,
      dueDate: dueDate || undefined, eventDate: eventDate || undefined,
      startTime: startTime || undefined, description: description || undefined,
      amount: amount ? Number(amount) : undefined,
      vendor: vendor || undefined, url: url || undefined,
      username: username || undefined, password: password || undefined,
      birthdayPerson: birthdayPerson || undefined,
      items: items.length > 0 ? items : undefined,
      recurrence: showRecurrence ? recurrence : undefined,
      coverImage, creator, year, faviconUrl, siteName,
    });
    onClose();
  };

  const dim = textColor === "#f5f5f5";
  const fieldBg = dim ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)";

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="flex-1" onClick={onClose} />
      <div className="animate-sheet-up flex flex-col overflow-hidden rounded-t-2xl" style={{ background: "#ffffff", maxHeight: "92dvh" }}>
        {/* Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-10 rounded-full" style={{ background: "#e0e0e0" }} />
        </div>

        {/* Header */}
        <header className="flex h-12 flex-shrink-0 items-center justify-between border-b px-4" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <button onClick={onClose} className="min-w-[44px] py-2 text-sm font-semibold" style={{ color: "#888" }}>Cancel</button>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#aaa" }}>New {type}</span>
          <button onClick={handleSave} disabled={!canSave}
            className="min-w-[44px] rounded-lg px-3 py-2 text-sm font-bold transition-opacity disabled:opacity-30"
            style={{ background: "#1a1e2e", color: "#fff" }}>
            Save
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4" onClick={() => setActivePopup(null)}>
          {/* ---- STICKY NOTE CARD FORM ---- */}
          <div className="relative overflow-visible" onClick={(e) => e.stopPropagation()}
            style={{
              background: bg, color: textColor, borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), 4px 6px 0 rgba(0,0,0,0.03)",
              padding: "18px 16px 52px 16px",
            }}>

            {/* PIN (top center) */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -6 }}>
              <button onClick={() => setPinned(!pinned)} className="relative flex flex-col items-center">
                {pinned ? (
                  <>
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
                    }}>
                      <div style={{ position: "absolute", top: 3, left: 4, width: 4, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.35)" }} />
                    </div>
                    <div style={{ width: 2, height: 5, background: "#888", margin: "0 auto", borderRadius: 1 }} />
                  </>
                ) : (
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px dashed rgba(0,0,0,0.12)" }} />
                )}
              </button>
            </div>

            {/* TOP ROW: Circle + Priority */}
            <div className="mt-2 flex items-start justify-between">
              <div className="relative">
                <button onClick={() => togglePopup("circle")}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={circle ? {
                    background: CIRCLE_STICKER_COLORS[circle].bg,
                    boxShadow: `0 2px 0 0 ${CIRCLE_STICKER_COLORS[circle].shadow}, 0 2px 6px rgba(0,0,0,0.18)`,
                  } : { border: "2px dashed rgba(0,0,0,0.18)" }}>
                  {circle ? (
                    (() => { const CI = CIRCLE_ICONS[circle]; return <CI className="h-4 w-4 text-white" strokeWidth={2.5} />; })()
                  ) : (
                    <span className="text-[9px] font-bold" style={{ color: dim ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)" }}>@</span>
                  )}
                </button>
                {activePopup === "circle" && (
                  <div className="animate-scale-in absolute left-0 top-10 z-30 flex gap-1.5 rounded-xl border bg-white p-2.5 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <button onClick={() => { setCircle(undefined); setActivePopup(null); }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold" style={{ color: "#aaa" }}>--</button>
                    {allCircles.map((c) => {
                      const CI = CIRCLE_ICONS[c];
                      const col = CIRCLE_STICKER_COLORS[c];
                      return (
                        <button key={c} onClick={() => { setCircle(c); setActivePopup(null); }}
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
                  className={`flex h-7 w-7 items-center justify-center ${getPrioritySticker(priority).animated ? "animate-urgent-flash" : ""}`}
                  style={{ background: getPrioritySticker(priority).bg, borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                  <span className="text-xs font-bold text-white">
                    {priority === "urgent" ? "!!" : priority === "high" ? "!" : priority === "medium" ? "-" : ""}
                  </span>
                </button>
                {activePopup === "priority" && (
                  <div className="animate-scale-in absolute right-0 top-9 z-30 flex gap-1.5 rounded-xl border bg-white p-2.5 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    {allPriorities.map((p) => {
                      const s = getPrioritySticker(p);
                      return (
                        <button key={p} onClick={() => { setPriority(p); setActivePopup(null); }}
                          className={`flex h-7 w-7 items-center justify-center ${priority === p ? "ring-2 ring-black/20" : ""}`}
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

            {/* MEDIA SEARCH (movie / book / song) */}
            {isMedia && (
              <div className="mt-3">
                <MediaSearchField
                  type={type as "movie" | "book" | "song"}
                  query={mediaQuery}
                  onQueryChange={setMediaQuery}
                  selectedImage={coverImage}
                  textColor={textColor}
                  onSelect={(r) => {
                    setTitle(r.title);
                    setCoverImage(r.image);
                    setCreator(r.subtitle);
                    setYear(r.year);
                    setMediaQuery(r.title);
                  }}
                />
              </div>
            )}

            {/* TITLE */}
            <div className="mt-3">
              <input className="w-full bg-transparent text-lg font-black outline-none"
                style={{ color: isTitleMissing ? "#ef4444" : textColor }}
                placeholder={isTitleMissing ? "Title (required)" : "Title..."}
                value={title} onChange={(e) => setTitle(e.target.value)} autoFocus={!isMedia} />
              {isMedia && creator && (
                <p className="mt-0.5 text-xs font-semibold" style={{ color: textColor, opacity: 0.65 }}>
                  {creator}{year ? ` \u00b7 ${year}` : ""}
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            <div className="mt-2 space-y-2">
              {type === "event" && (
                <label className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: textColor, opacity: 0.6 }}>
                  Start time:
                  <input type="time" className="bg-transparent text-xs font-bold outline-none" style={{ color: textColor }}
                    value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
              )}
              {isBirthday && (
                <input className="w-full bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                  placeholder="Person's name" value={birthdayPerson} onChange={(e) => setBirthdayPerson(e.target.value)} />
              )}
              {isExpense && (
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black" style={{ color: textColor }}>$</span>
                  <input className="w-32 bg-transparent font-mono text-xl font-black outline-none placeholder:opacity-30"
                    style={{ color: textColor }} placeholder="0.00" type="number" step="0.01"
                    value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              )}
              {isExpense && (
                <input className="w-full bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                  placeholder="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
              )}
              {isBookmark && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: fieldBg }}>
                    {bookmarkLoading ? (
                      <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" style={{ color: textColor, opacity: 0.5 }} />
                    ) : faviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={faviconUrl} alt="" className="h-4 w-4 flex-shrink-0 rounded" crossOrigin="anonymous" />
                    ) : null}
                    <input className="w-full bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                      placeholder="https://... (auto-fetches title & icon)" value={url} onChange={(e) => setUrl(e.target.value)} />
                  </div>
                  {coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImage} alt="" className="h-20 w-full rounded-lg object-cover" crossOrigin="anonymous" />
                  )}
                </div>
              )}
              {isPassword && (
                <div className="space-y-1.5">
                  <WebsiteAutocomplete
                    value={url}
                    onChange={setUrl}
                    onPickSite={handlePickSite}
                    textColor={textColor}
                    placeholder="Website or service (e.g. Fizz, WealthSimple)"
                  />
                  <input className="w-full bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                    placeholder="Username / email" value={username} onChange={(e) => setUsername(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <input type={showPassword ? "text" : "password"}
                      className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:opacity-40"
                      style={{ color: textColor }} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={() => setShowPassword(!showPassword)} className="opacity-40 hover:opacity-70" style={{ color: textColor }}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => { const p = generatePassphrase(); setPassword(p); setShowPassword(true); }}
                      className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: fieldBg, color: textColor }}>
                      <Wand2 className="h-3 w-3" /> Suggest
                    </button>
                  </div>
                  <PasswordStrengthMeter password={password} />
                </div>
              )}
              {!isMedia && (
                <textarea className="w-full bg-transparent text-xs leading-relaxed outline-none placeholder:opacity-40"
                  style={{ color: textColor }} placeholder="Description (optional)" rows={2}
                  value={description} onChange={(e) => setDescription(e.target.value)} />
              )}
              {type === "list" && (
                <div className="space-y-1">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 flex-shrink-0 border" style={{ borderColor: "rgba(0,0,0,0.2)", borderRadius: 2 }} />
                      <input className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-30" style={{ color: textColor }}
                        value={item.text} placeholder="Item..."
                        onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], text: e.target.value }; setItems(n); }} />
                      <button onClick={() => setItems(items.filter((_, i) => i !== idx))}><X className="h-3 w-3 opacity-30" /></button>
                    </div>
                  ))}
                  <button onClick={() => setItems([...items, { id: Math.random().toString(36).slice(2, 8), text: "", checked: false }])}
                    className="flex items-center gap-1 text-[10px] opacity-50"><Plus className="h-3 w-3" /> Add item</button>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {tags.map((tag, idx) => (
                <span key={tag} className="flex items-center gap-0.5 px-1 py-px text-[9px] font-bold" style={{ background: fieldBg, color: textColor }}>
                  #{tag}
                  <button onClick={() => setTags(tags.filter((_, i) => i !== idx))}><X className="h-2.5 w-2.5 opacity-40" /></button>
                </span>
              ))}
              <input className="w-16 bg-transparent text-[10px] outline-none placeholder:opacity-30" style={{ color: textColor }}
                placeholder="#tag" onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    setTags([...tags, e.currentTarget.value.trim().replace(/^#/, "")]);
                    e.currentTarget.value = "";
                  }
                }} />
            </div>

            {/* UNIVERSAL DUE / EVENT DATE */}
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: isDateMissing ? "#ef4444" : textColor, opacity: isDateMissing ? 1 : 0.55 }}>
                {usesEventDate ? "Event date" : "Due date"}{dueRequired ? " (required)" : " (optional)"}:
                <input type="date" className="bg-transparent text-[10px] outline-none" style={{ color: isDateMissing ? "#ef4444" : textColor }}
                  value={usesEventDate ? eventDate : dueDate}
                  onChange={(e) => { if (usesEventDate) setEventDate(e.target.value); else setDueDate(e.target.value); }} />
              </label>
            </div>

            {/* RECURRENCE (appears when a date is present) */}
            {showRecurrence && (
              <RecurrenceSection value={recurrence} onChange={setRecurrence} textColor={textColor} />
            )}

            {/* CHECKBOX (lower-left) */}
            <div className="absolute bottom-2 left-3">
              {(type === "task" || type === "list" || type === "reminder") && (
                <div className="flex h-5 w-5 items-center justify-center rounded-sm border-2"
                  style={{ borderColor: dim ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)", background: dim ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}>
                </div>
              )}
            </div>

            {/* TYPE ICON (lower-right) -- grid picker */}
            <div className="absolute bottom-2 right-3 z-20">
              <button onClick={() => togglePopup("type")} className="flex items-center gap-1 rounded px-1.5 py-0.5"
                style={{ background: fieldBg }}>
                <TypeIcon className="h-4 w-4" style={{ color: textColor, opacity: 0.5 }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: textColor, opacity: 0.4 }}>{type}</span>
              </button>
              {activePopup === "type" && (
                <div className="animate-scale-in absolute bottom-8 right-0 z-30 rounded-xl border bg-white p-3 shadow-xl"
                  style={{ borderColor: "rgba(0,0,0,0.08)", width: 224 }}>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Change type</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {allTypes.map((t) => {
                      const TI = TYPE_ICONS[t];
                      const active = type === t;
                      return (
                        <button key={t} onClick={() => switchType(t)}
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
    </div>
  );
}
