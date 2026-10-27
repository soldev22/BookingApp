"use client";

import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePoundSterling,
  Clock3,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { activity, bookings, type DemoBooking, weekDays } from "@/lib/demo-data";
import { cn, formatMoney } from "@/lib/utils";

type Section =
  | "Overview"
  | "Bookings"
  | "Today"
  | "Customers"
  | "Messages"
  | "Reports"
  | "Settings";

const nav = [
  { label: "Overview" as const, icon: LayoutDashboard },
  { label: "Bookings" as const, icon: CalendarDays },
  { label: "Today" as const, icon: Clock3, badge: "5" },
  { label: "Customers" as const, icon: Users },
  { label: "Messages" as const, icon: MessageSquareText, badge: "2" },
  { label: "Reports" as const, icon: FileBarChart },
];

const toneClasses: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
};

function Sidebar({
  section,
  onNavigate,
  open,
  onClose,
}: {
  section: Section;
  onNavigate: (section: Section) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-white/8 bg-[#251f2a] text-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-24 items-center gap-3 px-7">
          <div className="grid size-10 place-items-center rounded-2xl bg-white text-plum shadow-lg shadow-black/20">
            <Sparkles size={21} strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display text-[23px] leading-none font-semibold">
              SalonFlow
            </div>
            <div className="mt-1 text-[10px] tracking-[0.22em] text-white/40 uppercase">
              Booking, beautifully
            </div>
          </div>
          <button
            className="ml-auto text-white/60 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mx-4 mb-6 rounded-2xl border border-white/8 bg-white/5 p-3">
          <button className="flex w-full items-center gap-3 text-left">
            <div className="grid size-9 place-items-center rounded-xl bg-[#d8b7bb] text-sm font-bold text-[#4d3036]">
              RH
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Rose & Honey</p>
              <p className="truncate text-xs text-white/45">London, UK</p>
            </div>
            <ChevronDown size={15} className="text-white/35" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4" aria-label="Main navigation">
          <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-white/30 uppercase">
            Workspace
          </p>
          {nav.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onNavigate(item.label);
                onClose();
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                section === item.label
                  ? "bg-white text-[#2a222e] shadow-lg shadow-black/15"
                  : "text-white/55 hover:bg-white/7 hover:text-white",
              )}
            >
              <item.icon size={18} strokeWidth={1.8} />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    section === item.label
                      ? "bg-plum text-white"
                      : "bg-white/10 text-white/60",
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/8 p-4">
          <button
            onClick={() => onNavigate("Settings")}
            className={cn(
              "mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
              section === "Settings"
                ? "bg-white text-[#2a222e]"
                : "text-white/55 hover:bg-white/7 hover:text-white",
            )}
          >
            <Settings size={18} />
            Settings
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-full bg-[#a56378] text-xs font-bold">
              OM
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Olivia Martin</p>
              <p className="text-xs text-white/40">Owner</p>
            </div>
            <MoreHorizontal size={18} className="text-white/35" />
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  title,
  onMenu,
  onNewBooking,
}: {
  title: Section;
  onMenu: () => void;
  onNewBooking: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
      <button
        onClick={onMenu}
        className="mr-3 rounded-lg p-2 text-muted hover:bg-canvas lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>
      <div>
        <p className="text-[10px] font-bold tracking-[0.14em] text-plum uppercase lg:hidden">
          Rose & Honey
        </p>
        <h1 className="font-display text-2xl font-semibold lg:text-[27px]">
          {title}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button className="relative grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:bg-canvas">
          <Bell size={18} />
          <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-rose-500" />
        </button>
        <button
          onClick={onNewBooking}
          className="flex h-10 items-center gap-2 rounded-xl bg-plum px-3.5 text-sm font-semibold text-white shadow-lg shadow-plum/20 transition hover:bg-plum-dark sm:px-5"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">New booking</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof CalendarDays;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgb(31_29_43/0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted">{label}</p>
          <p className="mt-2 font-display text-[29px] leading-none font-semibold">
            {value}
          </p>
        </div>
        <div className={cn("grid size-10 place-items-center rounded-xl", tone)}>
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted">{detail}</p>
    </div>
  );
}

function StatusPill({ booking }: { booking: DemoBooking }) {
  const classes =
    booking.status === "Completed"
      ? "bg-emerald-50 text-emerald-700"
      : booking.status === "Pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-violet-50 text-violet-700";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", classes)}>
      {booking.status}
    </span>
  );
}

function BookingRow({
  booking,
  compact = false,
  onPaid,
}: {
  booking: DemoBooking;
  compact?: boolean;
  onPaid?: (id: string) => void;
}) {
  return (
    <div className="group flex items-center gap-3 border-b border-line px-4 py-4 last:border-0 sm:px-5">
      <div className="w-[48px] shrink-0">
        <p className="text-sm font-bold">{booking.time}</p>
        <p className="mt-0.5 text-[10px] text-muted">{booking.endTime}</p>
      </div>
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold",
          toneClasses[booking.colour],
        )}
      >
        {booking.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{booking.customer}</p>
          {!compact && <StatusPill booking={booking} />}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {booking.service} · {booking.staff}
        </p>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-bold">{formatMoney(booking.amountPence)}</p>
        <p
          className={cn(
            "mt-0.5 text-[10px] font-semibold",
            booking.payment === "Paid"
              ? "text-emerald-600"
              : booking.payment === "Deposit"
                ? "text-amber-600"
                : "text-rose-600",
          )}
        >
          {booking.payment}
        </p>
      </div>
      {onPaid && booking.payment !== "Paid" ? (
        <button
          onClick={() => onPaid(booking.id)}
          className="ml-1 rounded-xl bg-[#29222e] px-3 py-2 text-[11px] font-semibold whitespace-nowrap text-white hover:bg-plum"
        >
          Mark paid
        </button>
      ) : (
        <button
          className="rounded-lg p-1.5 text-muted opacity-60 transition hover:bg-canvas group-hover:opacity-100"
          aria-label={`Options for ${booking.customer}`}
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    </div>
  );
}

function Overview() {
  return (
    <div className="animate-enter space-y-6">
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-plum">Tuesday, 27 October</p>
          <h2 className="mt-1 font-display text-3xl font-semibold sm:text-[36px]">
            Good afternoon, Olivia.
          </h2>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s what&apos;s happening at Rose & Honey today.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold shadow-sm">
          <CalendarDays size={15} className="text-plum" />
          27 Oct – 2 Nov
          <ChevronDown size={14} className="text-muted" />
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today's bookings"
          value="5"
          detail="2 still to come"
          icon={CalendarDays}
          tone="bg-violet-50 text-violet-600"
        />
        <StatCard
          label="Revenue today"
          value="£268"
          detail="+12% from last Tuesday"
          icon={CirclePoundSterling}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Awaiting payment"
          value="£97"
          detail="Across 2 bookings"
          icon={CreditCard}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="New customers"
          value="3"
          detail="This week"
          icon={Users}
          tone="bg-rose-50 text-rose-600"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgb(31_29_43/0.035)]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-display text-lg font-semibold">
                Today&apos;s appointments
              </h3>
              <p className="mt-0.5 text-[11px] text-muted">
                5 bookings · £268 expected
              </p>
            </div>
            <button className="flex items-center gap-1 text-xs font-bold text-plum">
              View calendar <ChevronRight size={14} />
            </button>
          </div>
          {bookings.map((booking) => (
            <BookingRow booking={booking} key={booking.id} />
          ))}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgb(31_29_43/0.035)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">This week</h3>
                <p className="mt-0.5 text-[11px] text-muted">
                  53 appointments booked
                </p>
              </div>
              <div className="flex gap-1">
                <button className="grid size-7 place-items-center rounded-lg border border-line">
                  <ChevronLeft size={13} />
                </button>
                <button className="grid size-7 place-items-center rounded-lg border border-line">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
            <div className="flex h-36 items-end justify-between gap-2">
              {weekDays.map((day, index) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[9px] font-bold text-muted">
                    {day.count || "–"}
                  </span>
                  <div className="flex h-20 w-full items-end justify-center rounded-lg bg-canvas">
                    <div
                      className={cn(
                        "w-full rounded-lg transition-all",
                        index === 1 ? "bg-plum" : "bg-[#d9c9dc]",
                      )}
                      style={{ height: `${Math.max(day.count * 7, 4)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-semibold text-muted">{day.day}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs font-bold",
                        index === 1 && "text-plum",
                      )}
                    >
                      {day.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_8px_30px_rgb(31_29_43/0.035)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Recent activity</h3>
              <button className="text-[11px] font-bold text-plum">View all</button>
            </div>
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.name} className="flex gap-3">
                  <div
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full",
                      item.tone === "emerald"
                        ? "bg-emerald-500"
                        : item.tone === "violet"
                          ? "bg-violet-500"
                          : "bg-amber-500",
                    )}
                  />
                  <div>
                    <p className="text-xs leading-5">
                      <strong>{item.name}</strong> {item.action}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function BookingsView() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.customer.toLowerCase().includes(query.toLowerCase()) ||
          booking.service.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );
  return (
    <div className="animate-enter space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold">Bookings</h2>
        <p className="mt-1 text-sm text-muted">
          Manage appointments, payments and customer journeys.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
          <label className="flex h-10 flex-1 items-center gap-2 rounded-xl bg-canvas px-3 text-muted">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer or service"
              className="w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <select className="h-10 rounded-xl border border-line bg-white px-3 text-xs font-semibold">
            <option>All statuses</option>
            <option>Confirmed</option>
            <option>Pending payment</option>
            <option>Completed</option>
          </select>
        </div>
        {filtered.length ? (
          filtered.map((booking) => (
            <BookingRow booking={booking} key={booking.id} />
          ))
        ) : (
          <div className="p-12 text-center text-sm text-muted">
            No bookings match “{query}”.
          </div>
        )}
      </div>
    </div>
  );
}

function TodayView() {
  const [paid, setPaid] = useState<string[]>(
    bookings.filter((booking) => booking.payment === "Paid").map((booking) => booking.id),
  );
  const visible = bookings.map((booking) =>
    paid.includes(booking.id) ? { ...booking, payment: "Paid" as const } : booking,
  );
  const outstanding = visible
    .filter((booking) => booking.payment !== "Paid")
    .reduce((sum, booking) => sum + booking.amountPence, 0);
  return (
    <div className="animate-enter space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-plum">Tuesday, 27 October</p>
          <h2 className="mt-1 font-display text-3xl font-semibold">Today</h2>
          <p className="mt-1 text-sm text-muted">
            A focused view for your front desk.
          </p>
        </div>
        <div className="rounded-2xl bg-[#29222e] px-5 py-3 text-white">
          <p className="text-[10px] text-white/50">Still to collect</p>
          <p className="font-display text-2xl font-semibold">
            {formatMoney(outstanding)}
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {visible.map((booking) => (
          <BookingRow
            booking={booking}
            key={booking.id}
            onPaid={(id) => setPaid((items) => [...items, id])}
          />
        ))}
      </div>
    </div>
  );
}

function CustomersView() {
  return (
    <div className="animate-enter space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold">Customers</h2>
        <p className="mt-1 text-sm text-muted">
          Customer history, preferences and payment flags.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bookings.slice(0, 5).map((booking, index) => (
          <div key={booking.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "grid size-11 place-items-center rounded-2xl text-xs font-bold",
                  toneClasses[booking.colour],
                )}
              >
                {booking.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{booking.customer}</p>
                <p className="text-[11px] text-muted">Customer since 2025</p>
              </div>
              <MoreHorizontal size={18} className="text-muted" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
              <div>
                <p className="text-[10px] text-muted">Total visits</p>
                <p className="mt-1 text-sm font-bold">{index + 3}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted">Lifetime value</p>
                <p className="mt-1 text-sm font-bold">
                  {formatMoney(booking.amountPence * (index + 2))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenericView({ section }: { section: "Messages" | "Reports" | "Settings" }) {
  const content = {
    Messages: {
      title: "Message centre",
      copy: "Track every email, SMS and Messenger delivery in one place.",
      cards: ["Payment confirmation", "Appointment reminder", "Review request"],
    },
    Reports: {
      title: "Reports & payouts",
      copy: "Clear numbers for revenue, outstanding balances and payouts.",
      cards: ["October revenue · £8,420", "Balance owed · £6,181", "Credit liability · £245"],
    },
    Settings: {
      title: "Business settings",
      copy: "Configure services, hours, policies, staff and your brand.",
      cards: ["Business profile", "Services & resources", "Payment & cancellation policies"],
    },
  }[section];
  return (
    <div className="animate-enter space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold">{content.title}</h2>
        <p className="mt-1 text-sm text-muted">{content.copy}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {content.cards.map((card, index) => (
          <button
            key={card}
            className="group rounded-2xl border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-plum/30 hover:shadow-lg"
          >
            <div className="mb-8 grid size-10 place-items-center rounded-xl bg-plum-soft text-plum">
              {section === "Messages" ? (
                <MessageSquareText size={18} />
              ) : section === "Reports" ? (
                <FileBarChart size={18} />
              ) : (
                <Settings size={18} />
              )}
            </div>
            <p className="text-sm font-bold">{card}</p>
            <p className="mt-1 text-[11px] text-muted">
              {index === 0 ? "View details and manage" : "Review configuration"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18131c]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="max-h-[95vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {saved ? (
          <div className="p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={30} />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">
              Booking created
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              The confirmation and secure customer link are ready to send.
            </p>
            <button
              onClick={onClose}
              className="mt-7 rounded-xl bg-plum px-6 py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-plum uppercase">
                  New appointment
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold">
                  Create a booking
                </h2>
              </div>
              <button
                onClick={onClose}
                className="grid size-9 place-items-center rounded-xl bg-canvas text-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-5 p-6"
              onSubmit={(event) => {
                event.preventDefault();
                setSaved(true);
              }}
            >
              <div>
                <label className="mb-2 block text-xs font-bold">Customer</label>
                <input
                  required
                  placeholder="Search or enter a new customer"
                  className="h-11 w-full rounded-xl border border-line px-3.5 text-sm outline-none focus:border-plum"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold">Service</label>
                  <select className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
                    <option>Cut & blow dry · £48</option>
                    <option>Balayage refresh · £95</option>
                    <option>Luxury facial · £65</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold">Team member</label>
                  <select className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
                    <option>Olivia</option>
                    <option>Amelia</option>
                    <option>Mia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold">Date</label>
                  <input
                    type="date"
                    defaultValue="2026-10-28"
                    className="h-11 w-full rounded-xl border border-line px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold">Time</label>
                  <input
                    type="time"
                    defaultValue="10:00"
                    className="h-11 w-full rounded-xl border border-line px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold">Payment timing</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Pay now", "Deposit", "On the day"].map((item, index) => (
                    <label
                      key={item}
                      className="flex cursor-pointer items-center justify-center rounded-xl border border-line p-3 text-center text-[11px] font-bold has-checked:border-plum has-checked:bg-plum-soft has-checked:text-plum"
                    >
                      <input
                        type="radio"
                        name="payment"
                        className="sr-only"
                        defaultChecked={index === 0}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                <strong>Available.</strong> No resource clashes or capacity issues
                were found.
              </div>
              <button className="h-12 w-full rounded-xl bg-plum text-sm font-bold text-white shadow-lg shadow-plum/20 hover:bg-plum-dark">
                Create booking & send confirmation
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function SalonDashboard() {
  const [section, setSection] = useState<Section>("Overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar
        section={section}
        onNavigate={setSection}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="min-h-screen lg:pl-[268px]">
        <Header
          title={section}
          onMenu={() => setMenuOpen(true)}
          onNewBooking={() => setModalOpen(true)}
        />
        <main className="mx-auto max-w-[1460px] p-4 sm:p-7 lg:p-10">
          {section === "Overview" && <Overview />}
          {section === "Bookings" && <BookingsView />}
          {section === "Today" && <TodayView />}
          {section === "Customers" && <CustomersView />}
          {(section === "Messages" ||
            section === "Reports" ||
            section === "Settings") && <GenericView section={section} />}
        </main>
      </div>
      {modalOpen && <BookingModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
