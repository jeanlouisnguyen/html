"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import type { Thing, ThingType, Circle, Priority, ListItem, Recurrence, MediaStatus } from "@/lib/types";
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
import { cacheCoverImage } from "@/lib/cache-image";
import { generatePassphrase } from "@/lib/password-strength";
import { faviconFor, type SiteSuggestion } from "@/lib/website-suggestions";
import PasswordStrengthMeter from "./password-strength-meter";
import WebsiteAutocomplete from "./website-autocomplete";
import MediaSearchField from "./media-search-field";
import RecurrenceSection from "./recurrence-section";
import { MediaStatusPicker, StarRating } from "./media-tracker-controls";
import { PushPin } from "./push-pin";
import DeleteThrowGame from "./delete-throw-game";
import { X, Plus, Eye, EyeOff, Wand2, Loader2, Copy, Check, Trash2, Cloud, CheckCheck } from "lucide-react";

const TYPE_LABELS: Record<ThingType, string> = {
  task: "Task", note: "Note", event: "Event", reminder: "Reminder", list: "List",
  bookmark: "Bookmark", expense: "Expense", subscription: "Subscription", birthday: "Birthday",
  password: "Password", movie: "Movie", book: "Book", song: "Song",
};

export interface OriginRect { left: number; top: number; width: number; height: number; }

interface StickyNoteEditorProps {
  mode: "create" | "edit";
  /** create: seed defaults; edit: the existing thing */
  initial: Partial<Thing> & { type: ThingType };
  originRect?: OriginRect | null;
  /** create only */
  onCreate?: (t: Omit<Thing, "id" | "createdAt">) => void;
  /** edit only — called debounced on every change (real-time autosave) */
  onUpdate?: (updates: Partial<Thing>) => void;
  /** edit only — toggles completion through the store so recurring items roll forward */
  onToggleComplete?: () => void;
  /** edit only — actually remove after the throw game completes */
  onDelete?: () => void;
  onClose: () => void;
}

export default function StickyNoteEditor({
  mode, initial, originRect, onCreate, onUpdate, onToggleComplete, onDelete, onClose,
}: StickyNoteEditorProps) {
  const isEdit = mode === "edit";

  const [draft, setDraft] = useState<Thing>(() => ({
    id: initial.id || "",
    title: initial.title || "",
    type: initial.type,
    circle: initial.circle,
    priority: initial.priority || "medium",
    pinned: initial.pinned ?? false,
    completed: initial.completed ?? false,
    tags: initial.tags || [],
    createdAt: initial.createdAt || "",
    dueDate: initial.dueDate,
    eventDate: initial.eventDate,
    startTime: initial.startTime,
    description: initial.description,
    amount: initial.amount,
    vendor: initial.vendor,
    url: initial.url,
    password: initial.password,
    username: initial.username,
    items: initial.items,
    recurrence: initial.recurrence,
    birthdayPerson: initial.birthdayPerson,
    eisenhower: initial.eisenhower,
    coverImage: initial.coverImage,
    coverCached: initial.coverCached,
    creator: initial.creator,
    year: initial.year,
    faviconUrl: initial.faviconUrl,
    siteName: initial.siteName,
    mediaStatus: initial.mediaStatus,
    rating: initial.rating,
  }));

  const [activePopup, setActivePopup] = useState<"circle" | "priority" | "type" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mediaQuery, setMediaQuery] = useState(initial.title || "");
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "pending" | "saved">("idle");
  const [closing, setClosing] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  const type = draft.type;
  const isExpense = type === "expense" || type === "subscription";
  const isBirthday = type === "birthday";
  const isPassword = type === "password";
  const isBookmark = type === "bookmark";
  const isMedia = MEDIA_TYPES.includes(type);
  const usesEventDate = type === "event" || isBirthday;
  const relevantDate = usesEventDate ? draft.eventDate : draft.dueDate;
  const dueRequired = DUE_DATE_REQUIRED.includes(type);
  const showRecurrence = !!relevantDate && type !== "birthday";

  const bg = getCardBg(draft);
  const textColor = getCardTextColor(bg);
  const dim = textColor === "#f5f5f5";
  const fieldBg = dim ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)";
  const TypeIcon = TYPE_ICONS[type];

  const isTitleMissing = !draft.title.trim();
  const isDateMissing = dueRequired && !relevantDate;
  const canSave = !isTitleMissing && !isDateMissing;

  const allTypes = Object.keys(TYPE_ICONS) as ThingType[];
  const allCircles = Object.keys(CIRCLE_ICONS) as Circle[];
  const allPriorities: Priority[] = ["low", "medium", "high", "urgent"];

  /* ---------- patch + autosave ---------- */
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const patch = useCallback((p: Partial<Thing>) => {
    setDraft((d) => ({ ...d, ...p }));
    if (isEdit) {
      setSaveState("pending");
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        onUpdate?.(draftRef.current);
        setSaveState("saved");
      }, 500);
    }
  }, [isEdit, onUpdate]);

  useEffect(() => () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); }, []);

  const togglePopup = (p: "circle" | "priority" | "type") =>
    setActivePopup((cur) => (cur === p ? null : p));

  /* ---------- keyboard-aware centering ---------- */
  const [vp, setVp] = useState<{ h: number; top: number }>(() =>
    typeof window !== "undefined" ? { h: window.innerHeight, top: 0 } : { h: 800, top: 0 }
  );
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setVp({ h: vv.height, top: vv.offsetTop });
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  /* ---------- expand-from-origin animation ---------- */
  const noteRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const note = noteRef.current;
    if (!note || !originRect) return;
    const r = note.getBoundingClientRect();
    if (r.width === 0) return;
    const sx = Math.max(0.05, originRect.width / r.width);
    const sy = Math.max(0.05, originRect.height / r.height);
    const dx = originRect.left + originRect.width / 2 - (r.left + r.width / 2);
    const dy = originRect.top + originRect.height / 2 - (r.top + r.height / 2);
    note.style.transition = "none";
    note.style.transformOrigin = "center center";
    note.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    note.style.opacity = "0.35";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        note.style.transition =
          "transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease";
        note.style.transform = "translate(0,0) scale(1,1)";
        note.style.opacity = "1";
      });
    });
  }, [originRect]);

  /* ---------- cover image caching ---------- */
  const cacheCover = useCallback(async (remoteUrl: string, key: string) => {
    const cached = await cacheCoverImage(remoteUrl, key);
    if (cached !== remoteUrl) {
      setDraft((d) => (d.coverImage === remoteUrl ? { ...d, coverImage: cached, coverCached: true } : d));
      if (isEdit) onUpdate?.({ ...draftRef.current, coverImage: cached, coverCached: true });
    }
  }, [isEdit, onUpdate]);

  /* ---------- bookmark auto-fetch (debounced) ---------- */
  const bookmarkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isBookmark) return;
    const u = (draft.url || "").trim();
    if (u.length < 4 || !u.includes(".")) return;
    if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current);
    bookmarkTimer.current = setTimeout(async () => {
      setBookmarkLoading(true);
      try {
        const meta = await fetchBookmarkMeta(u);
        const updates: Partial<Thing> = { faviconUrl: meta.favicon, siteName: meta.siteName };
        if (meta.image) updates.coverImage = meta.image;
        if (!draftRef.current.title.trim()) updates.title = meta.title || meta.siteName || "";
        patch(updates);
        if (meta.image) cacheCover(meta.image, meta.siteName || u);
      } finally {
        setBookmarkLoading(false);
      }
    }, 700);
    return () => { if (bookmarkTimer.current) clearTimeout(bookmarkTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.url, isBookmark]);

  const handlePickSite = (s: SiteSuggestion) =>
    patch({ url: `https://${s.domain}`, faviconUrl: faviconFor(s.domain, 128) });

  /* ---------- close with collapse animation ---------- */
  const handleClose = useCallback(() => {
    if (autosaveTimer.current) { clearTimeout(autosaveTimer.current); }
    if (isEdit) onUpdate?.(draftRef.current);
    setClosing(true);
    setTimeout(onClose, 200);
  }, [isEdit, onUpdate, onClose]);

  /* Escape closes the editor (popups close first; ignored while the throw game owns the screen) */
  useEffect(() => {
    if (gameActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activePopup) setActivePopup(null);
      else handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activePopup, handleClose, gameActive]);

  /* ---------- create save ---------- */
  const handleCreate = async () => {
    if (!canSave) return;
    let cover = draft.coverImage;
    let cached = draft.coverCached;
    if (cover && !cached) {
      cover = await cacheCoverImage(cover, draft.title || cover);
      cached = true;
    }
    onCreate?.({
      title: draft.title.trim(), type, circle: draft.circle, priority: draft.priority,
      pinned: draft.pinned, completed: false, tags: draft.tags,
      dueDate: draft.dueDate || undefined, eventDate: draft.eventDate || undefined,
      startTime: draft.startTime || undefined, description: draft.description || undefined,
      amount: draft.amount, vendor: draft.vendor || undefined, url: draft.url || undefined,
      username: draft.username || undefined, password: draft.password || undefined,
      birthdayPerson: draft.birthdayPerson || undefined,
      items: draft.items && draft.items.length > 0 ? draft.items : undefined,
      recurrence: showRecurrence ? draft.recurrence : undefined,
      coverImage: cover, coverCached: cached, creator: draft.creator, year: draft.year,
      faviconUrl: draft.faviconUrl, siteName: draft.siteName,
      mediaStatus: draft.mediaStatus, rating: draft.rating,
    });
    onClose();
  };

  /* ---------- delete (edit) ---------- */
  const handleTrash = () => {
    if (isEdit) setGameActive(true);
    else handleClose(); // create: trash = discard
  };

  const title = `${isEdit ? "Edit" : "New"} / ${TYPE_LABELS[type]}`;

  if (gameActive) {
    const r = noteRef.current?.getBoundingClientRect();
    return (
      <DeleteThrowGame
        noteRect={r ? { left: r.left, top: r.top, width: r.width, height: r.height } : { left: vp.h * 0.2, top: vp.h * 0.3, width: 240, height: 300 }}
        bg={bg}
        title={draft.title || TYPE_LABELS[type]}
        onComplete={() => { onDelete?.(); onClose(); }}
        onCancel={() => setGameActive(false)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-40"
      style={{
        background: "rgba(10,12,20,0.55)",
        backdropFilter: "blur(7px)",
        WebkitBackdropFilter: "blur(7px)",
        opacity: closing ? 0 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* tap-to-dismiss layer */}
      <button aria-label="Close" className="absolute inset-0 h-full w-full cursor-default" onClick={handleClose} />

      {/* keyboard-aware centering container */}
      <div
        className="pointer-events-none absolute left-0 flex w-full flex-col items-center justify-center px-5"
        style={{ top: vp.top, height: vp.h, transition: "height 0.28s ease, top 0.28s ease" }}
        onClick={() => setActivePopup(null)}
      >
        {/* TITLE (above the note, centered, not part of it) */}
        <div className="pointer-events-auto mb-2 flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.92)" }}>
            {title}
          </span>
          {isEdit && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
            >
              {saveState === "pending" ? (
                <><Cloud className="h-3 w-3 animate-pulse" /> Saving…</>
              ) : (
                <><CheckCheck className="h-3 w-3" style={{ color: "#86efac" }} /> Saved</>
              )}
            </span>
          )}
        </div>

        {/* BIG PIN (sits on top edge of the note) */}
        <div className="pointer-events-auto relative z-20" style={{ marginBottom: -16 }}>
          <PushPin pinned={draft.pinned} size={30} onClick={() => patch({ pinned: !draft.pinned })} />
        </div>

        {/* ---- STICKY NOTE (no surrounding panel) ---- */}
        <div
          ref={noteRef}
          className="pointer-events-auto relative w-full overflow-visible"
          onClick={(e) => { e.stopPropagation(); }}
          style={{
            maxWidth: 360,
            background: bg,
            color: textColor,
            borderRadius: 4,
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)",
            padding: "22px 18px 46px 18px",
            maxHeight: vp.h - 150,
            overflowY: "auto",
          }}
        >
          {/* TOP ROW: Circle + Priority */}
          <div className="flex items-start justify-between">
            <div className="relative">
              <button onClick={() => togglePopup("circle")}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={draft.circle ? {
                  background: CIRCLE_STICKER_COLORS[draft.circle].bg,
                  boxShadow: `0 2px 0 0 ${CIRCLE_STICKER_COLORS[draft.circle].shadow}, 0 2px 6px rgba(0,0,0,0.18)`,
                } : { border: "2px dashed rgba(0,0,0,0.18)" }}>
                {draft.circle ? (
                  (() => { const CI = CIRCLE_ICONS[draft.circle]; return <CI className="h-4 w-4 text-white" strokeWidth={2.5} />; })()
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: dim ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)" }}>@</span>
                )}
              </button>
              {activePopup === "circle" && (
                <div className="animate-scale-in absolute left-0 top-11 z-30 flex gap-1.5 rounded-xl border bg-white p-2.5 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <button onClick={() => { patch({ circle: undefined }); setActivePopup(null); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[9px] font-bold" style={{ color: "#aaa" }}>--</button>
                  {allCircles.map((c) => {
                    const CI = CIRCLE_ICONS[c]; const col = CIRCLE_STICKER_COLORS[c];
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
                <div className="animate-scale-in absolute right-0 top-10 z-30 flex gap-1.5 rounded-xl border bg-white p-2.5 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
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

          {/* MEDIA SEARCH */}
          {isMedia && (
            <div className="mt-3">
              <MediaSearchField
                type={type as "movie" | "book" | "song"}
                query={mediaQuery}
                onQueryChange={setMediaQuery}
                selectedImage={draft.coverImage}
                textColor={textColor}
                onSelect={(r) => {
                  patch({ title: r.title, coverImage: r.image, creator: r.subtitle, year: r.year, coverCached: false });
                  setMediaQuery(r.title);
                  if (r.image) cacheCover(r.image, r.title);
                }}
              />
            </div>
          )}

          {/* TITLE */}
          <div className="mt-3">
            <input className="w-full bg-transparent text-lg font-black outline-none"
              style={{ color: isTitleMissing ? "#ef4444" : textColor }}
              placeholder={isTitleMissing ? "Title (required)" : "Title..."}
              value={draft.title} onChange={(e) => patch({ title: e.target.value })} autoFocus={!isMedia && !isEdit} />
            {isMedia && draft.creator && (
              <p className="mt-0.5 text-xs font-semibold" style={{ color: textColor, opacity: 0.65 }}>
                {draft.creator}{draft.year ? ` \u00b7 ${draft.year}` : ""}
              </p>
            )}
          </div>

          {/* MEDIA TRACKER: status + rating */}
          {isMedia && (
            <div className="mt-3 space-y-2">
              <MediaStatusPicker type={type} value={draft.mediaStatus} onChange={(s) => patch({ mediaStatus: s })} textColor={textColor} fieldBg={fieldBg} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: textColor, opacity: 0.55 }}>Rating</span>
                <StarRating value={draft.rating || 0} onChange={(n) => patch({ rating: n })} textColor={textColor} />
              </div>
            </div>
          )}

          {/* TYPE-SPECIFIC FIELDS */}
          <div className="mt-2 space-y-2">
            {type === "event" && (
              <label className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: textColor, opacity: 0.6 }}>
                Start time:
                <input type="time" className="bg-transparent text-xs font-bold outline-none" style={{ color: textColor }}
                  value={draft.startTime || ""} onChange={(e) => patch({ startTime: e.target.value })} />
              </label>
            )}
            {isBirthday && (
              <input className="w-full bg-transparent text-sm outline-none placeholder:opacity-40" style={{ color: textColor }}
                placeholder="Person's name" value={draft.birthdayPerson || ""} onChange={(e) => patch({ birthdayPerson: e.target.value })} />
            )}
            {isExpense && (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black" style={{ color: textColor }}>$</span>
                <input className="w-32 bg-transparent font-mono text-xl font-black outline-none placeholder:opacity-30"
                  style={{ color: textColor }} placeholder="0.00" type="number" step="0.01"
                  value={draft.amount ?? ""} onChange={(e) => patch({ amount: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            )}
            {isExpense && (
              <input className="w-full bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                placeholder="Vendor" value={draft.vendor || ""} onChange={(e) => patch({ vendor: e.target.value })} />
            )}
            {isBookmark && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: fieldBg }}>
                  {bookmarkLoading ? (
                    <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" style={{ color: textColor, opacity: 0.5 }} />
                  ) : draft.faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.faviconUrl} alt="" className="h-4 w-4 flex-shrink-0 rounded" crossOrigin="anonymous" />
                  ) : null}
                  <input className="w-full bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                    placeholder="https://... (auto-fetches title & icon)" value={draft.url || ""} onChange={(e) => patch({ url: e.target.value })} />
                </div>
                {draft.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.coverImage} alt="" className="h-20 w-full rounded-lg object-cover" crossOrigin="anonymous" />
                )}
              </div>
            )}
            {isPassword && (
              <div className="space-y-1.5">
                <WebsiteAutocomplete value={draft.url || ""} onChange={(v) => patch({ url: v })} onPickSite={handlePickSite}
                  textColor={textColor} placeholder="Website or service (e.g. Fizz, WealthSimple)" />
                <div className="flex items-center gap-2">
                  <input className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-40" style={{ color: textColor }}
                    placeholder="Username / email" value={draft.username || ""} onChange={(e) => patch({ username: e.target.value })} />
                  {isEdit && draft.username && (
                    <button onClick={() => navigator.clipboard.writeText(draft.username!)} className="opacity-40 hover:opacity-70" style={{ color: textColor }}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type={showPassword ? "text" : "password"}
                    className="flex-1 bg-transparent font-mono text-xs outline-none placeholder:opacity-40"
                    style={{ color: textColor }} placeholder="Password" value={draft.password || ""} onChange={(e) => patch({ password: e.target.value })} />
                  <button onClick={() => setShowPassword(!showPassword)} className="opacity-40 hover:opacity-70" style={{ color: textColor }}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => { const p = generatePassphrase(); patch({ password: p }); setShowPassword(true); }}
                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: fieldBg, color: textColor }}>
                    <Wand2 className="h-3 w-3" /> Suggest
                  </button>
                </div>
                <PasswordStrengthMeter password={draft.password || ""} />
              </div>
            )}
            {!isMedia && (
              <textarea className="w-full bg-transparent text-xs leading-relaxed outline-none placeholder:opacity-40"
                style={{ color: textColor }} placeholder="Description (optional)" rows={2}
                value={draft.description || ""} onChange={(e) => patch({ description: e.target.value })} />
            )}
            {type === "list" && (
              <div className="space-y-1">
                {(draft.items || []).map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <button onClick={() => {
                      const n = [...(draft.items || [])]; n[idx] = { ...n[idx], checked: !n[idx].checked }; patch({ items: n });
                    }}
                      className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-sm border"
                      style={{ borderColor: "rgba(0,0,0,0.2)", background: item.checked ? "rgba(0,0,0,0.15)" : "transparent" }}>
                      {item.checked && <Check className="h-2.5 w-2.5" style={{ color: textColor, opacity: 0.6 }} />}
                    </button>
                    <input className={`flex-1 bg-transparent text-xs outline-none placeholder:opacity-30 ${item.checked ? "line-through opacity-40" : ""}`} style={{ color: textColor }}
                      value={item.text} placeholder="Item..."
                      onChange={(e) => { const n = [...(draft.items || [])]; n[idx] = { ...n[idx], text: e.target.value }; patch({ items: n }); }} />
                    <button onClick={() => patch({ items: (draft.items || []).filter((_, i) => i !== idx) })}><X className="h-3 w-3 opacity-30" /></button>
                  </div>
                ))}
                <button onClick={() => patch({ items: [...(draft.items || []), { id: Math.random().toString(36).slice(2, 8), text: "", checked: false }] })}
                  className="flex items-center gap-1 text-[10px] opacity-50"><Plus className="h-3 w-3" /> Add item</button>
              </div>
            )}
          </div>

          {/* TAGS */}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {draft.tags.map((tag, idx) => (
              <span key={tag} className="flex items-center gap-0.5 px-1 py-px text-[9px] font-bold" style={{ background: fieldBg, color: textColor }}>
                #{tag}
                <button onClick={() => patch({ tags: draft.tags.filter((_, i) => i !== idx) })}><X className="h-2.5 w-2.5 opacity-40" /></button>
              </span>
            ))}
            <input className="w-16 bg-transparent text-[10px] outline-none placeholder:opacity-30" style={{ color: textColor }}
                  placeholder="#tag" onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  patch({ tags: [...draft.tags, e.currentTarget.value.trim().replace(/^#/, "")] });
                  e.currentTarget.value = "";
                }
              }} />
          </div>

          {/* DUE / EVENT DATE */}
          <div className="mt-3">
            <label className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: isDateMissing ? "#ef4444" : textColor, opacity: isDateMissing ? 1 : 0.55 }}>
              {usesEventDate ? "Event date" : "Due date"}{dueRequired ? " (required)" : " (optional)"}:
              <input type="date" className="bg-transparent text-[10px] outline-none" style={{ color: isDateMissing ? "#ef4444" : textColor }}
                value={relevantDate || ""}
                onChange={(e) => patch(usesEventDate ? { eventDate: e.target.value || undefined } : { dueDate: e.target.value || undefined })} />
            </label>
          </div>

          {/* RECURRENCE */}
          {showRecurrence && (
            <RecurrenceSection value={draft.recurrence} onChange={(r) => patch({ recurrence: r })} textColor={textColor} />
          )}

          {/* CHECKBOX (lower-left) */}
          {(type === "task" || type === "list" || type === "reminder") && (
            <div className="absolute bottom-2.5 left-3">
              <button
                aria-label={draft.completed ? "Mark incomplete" : "Mark complete"}
                onClick={() => {
                  if (onToggleComplete) {
                    // toggleComplete in the store handles recurrence spawning
                    onToggleComplete();
                    // keep local draft in sync visually
                    patch({ completed: !draft.completed });
                  } else {
                    patch({ completed: !draft.completed });
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded-sm border-2 transition-colors"
                style={{ borderColor: draft.completed ? "#22c55e" : (dim ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)"), background: draft.completed ? "#22c55e" : (dim ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)") }}>
                {draft.completed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </button>
            </div>
          )}

          {/* BOTTOM-RIGHT: type label + delete trash (to its right) */}
          <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5">
            <div className="relative">
              <button onClick={() => togglePopup("type")} className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: fieldBg }}>
                <TypeIcon className="h-4 w-4" style={{ color: textColor, opacity: 0.5 }} />
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: textColor, opacity: 0.45 }}>{type}</span>
              </button>
              {activePopup === "type" && (
                <div className="animate-scale-in absolute bottom-9 right-0 z-30 rounded-xl border bg-white p-3 shadow-xl" style={{ borderColor: "rgba(0,0,0,0.08)", width: 224 }}>
                  <p className="mb-2 text-[9px] font-black uppercase tracking-wider" style={{ color: "#888" }}>Change type</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {allTypes.map((t) => {
                      const TI = TYPE_ICONS[t]; const active = type === t;
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
            <button onClick={handleTrash} aria-label={isEdit ? "Delete entry" : "Discard"}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-transform active:scale-90"
              style={{ background: dim ? "rgba(239,68,68,0.22)" : "rgba(239,68,68,0.1)" }}>
              <Trash2 className="h-3.5 w-3.5" style={{ color: "#ef4444" }} />
            </button>
          </div>
        </div>

        {/* CREATE: manual Save button (lights up when valid) */}
        {!isEdit && (
          <button
            onClick={handleCreate}
            disabled={!canSave}
            className="pointer-events-auto mt-4 flex items-center gap-2 rounded-full px-7 py-3 text-sm font-black uppercase tracking-wider transition-all active:scale-95"
            style={{
              background: canSave ? "hsl(var(--primary))" : "rgba(255,255,255,0.18)",
              color: canSave ? "#1a1e2e" : "rgba(255,255,255,0.5)",
              boxShadow: canSave ? "0 6px 20px rgba(245,176,3,0.5)" : "none",
            }}
          >
            <Check className="h-4 w-4" strokeWidth={3} /> Save
          </button>
        )}
      </div>
    </div>
  );
}
