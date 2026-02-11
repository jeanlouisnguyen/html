"use client";

import { useState, useMemo } from "react";
import {
  X, Search, Activity, Airplay, AlertCircle, AlertTriangle, Anchor, Archive,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AtSign, Award, BarChart, Battery,
  Bell, Bluetooth, Bold, Book, Bookmark, Box, Briefcase, Building, Calendar,
  CalendarDays, Camera, Car, Check, CheckCircle, CheckSquare, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, Circle, Clipboard, Clock, Cloud, Code,
  Coffee, Command, Compass, Copy, CreditCard, Crop, Crosshair, Database, Disc,
  DollarSign, Download, Droplet, Edit, ExternalLink, Eye, EyeOff, FastForward,
  Feather, File, FileText, Film, Filter, Flag, Flame, Folder, Frown, Gift,
  Globe, Grid, HardDrive, Hash, Headphones, Heart, HelpCircle, Hexagon, Home,
  Inbox, Info, Key, Landmark, Laptop, Layers, Layout, LifeBuoy, Link, List,
  ListChecks, Loader, Lock, LogIn, LogOut, Mail, Map, MapPin, Maximize, Menu,
  MessageCircle, MessageSquare, Mic, Minus, Monitor, Moon, MoreHorizontal,
  Mountain, Mouse, Music, Navigation, Octagon, Package, Paperclip, Pause,
  PenTool, Percent, Phone, PieChart, Pin, Play, Plus, PlusCircle, Pocket,
  Power, Printer, Radio, RefreshCw, Repeat, Rewind, RotateCw, Rss, Ruler,
  Save, Scissors, Send, Server, Settings, Share, Share2, Shield, ShoppingBag,
  ShoppingCart, Shuffle, Sidebar, SkipBack, SkipForward, Smartphone, Smile,
  Speaker, Square, Star, Sun, Sunrise, Sunset, Tablet, Tag, Target, Terminal,
  Thermometer, ThumbsDown, ThumbsUp, ToggleLeft, Trash, TrendingDown,
  TrendingUp, Triangle, Truck, Tv, Type, Umbrella, Underline, Unlock, Upload,
  User, UserCheck, UserMinus, UserPlus, Users, Video, Voicemail, Volume,
  VolumeX, Watch, Wifi, Wind, XCircle, Zap, ZoomIn, ZoomOut, Banknote,
  Bike, Brain, Brush, Bug, Cake, Crown, Diamond, Fingerprint, Gamepad2,
  Gauge, Gem, Glasses, Hammer, Leaf, Lightbulb, Megaphone, Palette,
  Pencil, Plane, Plug, Rocket, Scale, Snowflake, Sparkles, Sprout,
  Store, Ticket, Timer, Trophy, Utensils, Wallet, Waves, Wrench,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

type LucideIcon = React.ComponentType<LucideProps>;

const ICON_MAP: Record<string, LucideIcon> = {
  Activity, Airplay, AlertCircle, AlertTriangle, Anchor, Archive,
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AtSign, Award, BarChart, Battery,
  Bell, Bluetooth, Bold, Book, Bookmark, Box, Briefcase, Building, Calendar,
  CalendarDays, Camera, Car, Check, CheckCircle, CheckSquare, ChevronDown,
  ChevronLeft, ChevronRight, ChevronUp, Circle, Clipboard, Clock, Cloud, Code,
  Coffee, Command, Compass, Copy, CreditCard, Crop, Crosshair, Database,
  Disc, DollarSign, Download, Droplet, Edit, ExternalLink, Eye, EyeOff,
  FastForward, Feather, File, FileText, Film, Filter, Flag, Flame, Folder,
  Frown, Gift, Globe, Grid, HardDrive, Hash, Headphones, Heart, HelpCircle,
  Hexagon, Home, Inbox, Info, Key, Landmark, Laptop, Layers, Layout,
  LifeBuoy, Link, List, ListChecks, Loader, Lock, LogIn, LogOut, Mail, Map,
  MapPin, Maximize, Menu, MessageCircle, MessageSquare, Mic, Minus, Monitor,
  Moon, MoreHorizontal, Mountain, Mouse, Music, Navigation, Octagon, Package,
  Paperclip, Pause, PenTool, Percent, Phone, PieChart, Pin, Play, Plus,
  PlusCircle, Pocket, Power, Printer, Radio, RefreshCw, Repeat, Rewind,
  RotateCw, Rss, Ruler, Save, Scissors, Send, Server, Settings, Share,
  Share2, Shield, ShoppingBag, ShoppingCart, Shuffle, Sidebar, SkipBack,
  SkipForward, Smartphone, Smile, Speaker, Square, Star, Sun, Sunrise, Sunset,
  Tablet, Tag, Target, Terminal, Thermometer, ThumbsDown, ThumbsUp, ToggleLeft,
  Trash, TrendingDown, TrendingUp, Triangle, Truck, Tv, Type, Umbrella,
  Underline, Unlock, Upload, User, UserCheck, UserMinus, UserPlus, Users,
  Video, Voicemail, Volume, VolumeX, Watch, Wifi, Wind, XCircle, Zap,
  ZoomIn, ZoomOut, Banknote, Bike, Brain, Brush, Bug, Cake,
  Crown, Diamond, Fingerprint, Gamepad2, Gauge, Gem, Glasses,
  Hammer, Leaf, Lightbulb, Megaphone, Palette, Pencil,
  Plane, Plug, Rocket, Scale, Snowflake, Sparkles, Sprout,
  Store, Ticket, Timer, Trophy, Utensils, Wallet, Waves, Wrench,
  Search, X,
};

const ICON_ENTRIES = Object.entries(ICON_MAP).map(([name, Icon]) => ({ name, Icon }));

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  onClose: () => void;
}

export default function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return ICON_ENTRIES;
    const q = query.toLowerCase();
    return ICON_ENTRIES.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div
        className="flex w-full max-w-md flex-col rounded-t-2xl"
        style={{ background: "#ffffff", maxHeight: "70vh" }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "#e5e5e5" }}>
          <h3 className="text-sm font-bold" style={{ color: "#1a1e2e" }}>Choose Icon</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "#f0f0f0" }}>
            <X className="h-4 w-4" style={{ color: "#1a1e2e" }} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "#e5e5e5" }}>
          <Search className="h-4 w-4 flex-shrink-0" style={{ color: "#999" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons..."
            className="flex-1 text-sm outline-none"
            style={{ color: "#1a1e2e", background: "transparent" }}
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-6 gap-1.5">
            {filtered.map(({ name, Icon }) => (
              <button
                key={name}
                onClick={() => { onChange(name); onClose(); }}
                className="flex flex-col items-center gap-0.5 rounded-lg p-2 transition-colors"
                style={{
                  background: value === name ? "#1a1e2e" : "#f8f8f8",
                  color: value === name ? "#fff" : "#555",
                }}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="truncate text-[7px] leading-tight" style={{ maxWidth: "100%" }}>{name}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-xs" style={{ color: "#999" }}>No icons found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Circle;
}
