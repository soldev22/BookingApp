export type DemoBooking = {
  id: string;
  time: string;
  endTime: string;
  customer: string;
  initials: string;
  service: string;
  staff: string;
  status: "Confirmed" | "Pending" | "Completed";
  payment: "Paid" | "Deposit" | "Due";
  amountPence: number;
  colour: string;
};

export const bookings: DemoBooking[] = [
  {
    id: "BK-1048",
    time: "09:00",
    endTime: "10:00",
    customer: "Sophie Miller",
    initials: "SM",
    service: "Cut & blow dry",
    staff: "Olivia",
    status: "Confirmed",
    payment: "Paid",
    amountPence: 4800,
    colour: "violet",
  },
  {
    id: "BK-1049",
    time: "10:30",
    endTime: "12:00",
    customer: "Emma Wilson",
    initials: "EW",
    service: "Balayage refresh",
    staff: "Amelia",
    status: "Confirmed",
    payment: "Deposit",
    amountPence: 9500,
    colour: "amber",
  },
  {
    id: "BK-1050",
    time: "12:30",
    endTime: "13:15",
    customer: "Lucy Thompson",
    initials: "LT",
    service: "Gel manicure",
    staff: "Mia",
    status: "Pending",
    payment: "Due",
    amountPence: 3200,
    colour: "rose",
  },
  {
    id: "BK-1051",
    time: "14:00",
    endTime: "15:00",
    customer: "Grace Walker",
    initials: "GW",
    service: "Luxury facial",
    staff: "Olivia",
    status: "Confirmed",
    payment: "Due",
    amountPence: 6500,
    colour: "emerald",
  },
  {
    id: "BK-1052",
    time: "15:30",
    endTime: "16:15",
    customer: "Isla Harris",
    initials: "IH",
    service: "Brow shape & tint",
    staff: "Mia",
    status: "Completed",
    payment: "Paid",
    amountPence: 2800,
    colour: "sky",
  },
];

export const weekDays = [
  { day: "Mon", date: "27", count: 7 },
  { day: "Tue", date: "28", count: 9 },
  { day: "Wed", date: "29", count: 6 },
  { day: "Thu", date: "30", count: 8 },
  { day: "Fri", date: "31", count: 11 },
  { day: "Sat", date: "01", count: 12 },
  { day: "Sun", date: "02", count: 0 },
];

export const activity = [
  {
    name: "Sophie Miller",
    action: "paid £48.00 for Cut & blow dry",
    time: "8 minutes ago",
    tone: "emerald",
  },
  {
    name: "Emma Wilson",
    action: "accepted the terms and paid her deposit",
    time: "32 minutes ago",
    tone: "violet",
  },
  {
    name: "Lucy Thompson",
    action: "received a payment reminder by SMS",
    time: "1 hour ago",
    tone: "amber",
  },
];
