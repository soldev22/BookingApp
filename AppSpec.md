You are helping me build a multi-tenant booking management web app. Read this whole brief first. Then ask me any clarifying questions and propose a project structure and data model for my approval before writing feature code. Build it in the phases listed at the end, and check in with me after each phase.

1. Concept
Businesses ("principals") get enquiries from customers on Facebook, SMS, phone and similar channels. Once they have agreed a date and time with the customer in that conversation, the principal enters the booking into this app. From there the app runs everything else: confirmation, payment, voucher, reminders, rescheduling, cancellations, refunds and credit vouchers.

Many companies use the app (multi-tenant), and each company's data must be fully isolated from the others. I am the platform operator. All online payments go into MY single Stripe account, and I pay each company what it is owed by a manual bank transfer. The app must therefore keep an accurate ledger of what is owed to each company (see section 18).

2. Tech stack
Next.js (latest, App Router) with TypeScript
Tailwind CSS + shadcn/ui, mobile-first (principals will mostly use phones)
MongoDB Atlas with Prisma ORM. Use a replica-set deployment so transactions are available.
Auth: Auth.js (NextAuth) or Clerk, with organisations/tenants and roles
Payments: Stripe, one platform account only. Use Checkout, webhooks and refunds. Do NOT use Stripe Connect.
SMS: Twilio
Email: Resend with React Email templates
Facebook: Meta Messenger Platform API
Background jobs/scheduling: Inngest or Trigger.dev (or Vercel Cron plus a jobs table)
PDF vouchers and receipts: @react-pdf/renderer, with a QR code holding the voucher code
Calendar files: ics package
Validation: Zod. Dates: date-fns-tz. Store all times in UTC and display them in each business's timezone (default Europe/London). Handle the BST/GMT changeover correctly.
Currency: GBP by default, stored as integer pence
Monitoring: Sentry. Logging: structured logs.
3. Roles
Super Admin (me, the platform operator): manages all organisations, payouts, platform fees, disputes and SMS usage, and can see platform-wide reports. Super Admin access to a tenant's data is audit-logged.
Owner: full control of their own organisation.
Staff: manages bookings. Owners choose in settings which sensitive actions Staff may perform (refunds, payment overrides, cancelling paid bookings).
Customer: no login. Customers act through secure, signed, expiring token links sent in their messages (view booking, pay, reschedule, cancel, join waiting list).
4. Organisation onboarding and settings
The Super Admin creates or invites an organisation, and the Owner then completes onboarding: business details, logo, brand colour, timezone, currency, VAT number (optional), and bank details for payouts (sort code and account number, shown masked and editable only by the Owner, with every change audit-logged and the Super Admin notified).
Opening hours per weekday, closed dates/holidays (with UK bank holidays as an option), and ad-hoc blocked-out times.
Services: name, description, duration, price, capacity (max bookings or max people per slot), and an optional buffer time between bookings.
Optional resources/staff members, so bookings can be assigned to a person or resource and clashes checked per resource.
Policies (with defaults shown):
refund cut-off: 120 hours before the appointment start time
credit voucher validity: 10 days
reschedule rules (section 10)
refund fee policy (section 11)
deposit amount (fixed or %)
no-show threshold (section 13)
payment chase/expiry timings for unpaid online bookings
Reminder offsets: default 3 days, 2 days and 1 day before.
Message templates per channel and per message type, with placeholders such as {customerName}, {businessName}, {service}, {date}, {time}, {partySize}, {amountDue}, {voucherCode}, {paymentLink}, {manageLink}, {cancelLink}, {reviewLink}.
Branding: logo and colour on emails, vouchers and customer pages; SMS sender ID (alphanumeric, where supported); email "from" name. Allow a verified custom email sending domain later.
Terms and conditions text and cancellation policy text, versioned (section 7).
Review links (Facebook page and Google review URL).
5. Creating bookings and availability
The principal creates a booking: customer (search existing, or create new with name, phone, email and Facebook link status), service, date and time, duration (defaults from the service), party size, assigned staff/resource (optional), price (defaults from service × party size, editable), notes, preferred contact channel(s) (Facebook / SMS / email, more than one allowed), and payment method (section 6).
Availability checks on save:
warn if outside opening hours or on a closed date
block double bookings where capacity for that slot or resource would be exceeded, taking buffer time into account
the principal can override a warning with a reason (audit-logged), but cannot exceed hard capacity unless the Owner allows it
Prevent race conditions when two people book the same slot at once (database transaction/locking or an exclusion constraint).
Show a warning if the customer has a no-show or late-cancel history (section 13).
6. Payment methods and principal override
Each booking has a payment method:

ONLINE_FULL: the customer pays in full online via Stripe.
ONLINE_DEPOSIT: the customer pays a deposit online and the balance on the day.
CASH_ON_DAY: nothing is paid upfront; the customer pays in full at the appointment.
The business enables or disables each method and chooses the default.

Principal override
The principal always has the final say on whether a booking is paid in advance or on the day.

The payment method is pre-selected from the business default, or forced to online/deposit if the customer is flagged requiresPrepayment. A customer flagged trusted defaults to pay on the day.
The principal can change it with a simple toggle: "Pay in advance" / "Deposit now, rest on the day" / "Pay on the day".
Overriding a system rule (e.g. allowing pay-on-the-day for a customer flagged for no-shows) shows a warning with the customer's history and asks for an optional reason. The override, who made it and the reason are audit-logged.
The payment method can be switched on an existing booking at any time before it is completed:
Pay on the day → pay in advance: generate and send a payment link. The booking stays CONFIRMED with paymentStatus UNPAID until paid. An optional deadline flags the booking if unpaid (it is auto-cancelled only if the business turns that on).
Pay in advance (unpaid) → pay on the day: expire the outstanding Stripe Checkout session, confirm the booking, and send an updated confirmation and voucher showing "Amount due on the day".
Already paid online → pay on the day: not allowed without first issuing a refund. Offer the refund action with a confirmation step.
Every change sends the customer an updated confirmation and voucher, and updates the amount due in the remaining reminders.
Owners choose whether Staff may override payment timing.
7. Confirmation, terms acceptance and voucher
Online payment methods
The booking starts as PENDING_PAYMENT. The customer is sent a confirmation request on their chosen channel(s), containing the booking details and a secure link to a booking page.
The booking page shows the details, the cancellation policy and the terms. The customer must tick "I agree to the terms and cancellation policy" before being taken to Stripe Checkout. Store the acceptance: timestamp, IP address, user agent and the terms/policy version.
When payment succeeds (from the Stripe webhook, handled idempotently), the booking becomes CONFIRMED.
If the booking is unpaid after the configured time, send a chase message. After the expiry time, expire the booking, release the slot and notify the principal.
Cash on the day
The booking goes straight to CONFIRMED with paymentStatus UNPAID.
The customer still gets a booking link where they accept the terms. Track whether terms have been accepted and show it to the principal.
On confirmation (all methods)
Generate a voucher: unique code, QR code, business name and logo, customer name, service, party size, exact date and time (in the business timezone), booking reference, payment status ("Paid", "Deposit paid – £X due on the day" or "Amount due on the day: £X"), and a short cancellation policy.
Send the voucher as a PDF attachment and/or link on the chosen channel(s), with an .ics calendar file attached to the email and an "Add to calendar" link in SMS/Messenger.
Schedule reminders (section 8).
Notify the principal (section 17).
8. Reminders
Send reminders 3 days, 2 days and 1 day before the appointment (offsets configurable) on the customer's chosen channel(s).
Each reminder includes the date, time, location, amount due if any (with "please bring cash" where relevant), and the manage link.
Skip any reminder whose send time has already passed when the booking is made.
Cancel pending reminders when a booking is cancelled, and reschedule them when it is moved.
Reminder jobs must be idempotent, so a retry never sends a duplicate.
9. Taking payment on the day
Mobile "Today" view: today's appointments, the amount due on each, and a big "Mark as paid" button. Scanning the voucher QR code opens the booking directly.
Record a payment: amount, method (CASH / CARD_IN_PERSON / BANK_TRANSFER), received at, recorded by, and notes. Partial payments are allowed and the outstanding balance is shown.
Mark the booking COMPLETED and set paymentStatus to PAID or PART_PAID. Optionally send a receipt to the customer.
The principal can mark a booking as NO_SHOW.
Manual payment records can only be edited with a reason, and every create/edit/delete is audit-logged.
10. Rescheduling
Both the customer (via the manage link) and the principal can request a new date and time. Customers can only pick slots the availability rules allow. Principals can override with a warning.
Default rules (configurable):
free to reschedule if done before the refund cut-off
after the cut-off, either not allowed (customer must contact the business) or allowed once
maximum number of reschedules per booking
The original payment carries over to the new booking. If the new price is higher, request the difference online or add it to the amount due on the day. If it is lower, refund the difference or issue credit (the principal chooses).
On a reschedule: issue an updated voucher, re-send the .ics file, replace the reminders, and notify both parties.
The reschedule history is kept on the booking.
11. Cancellation by the customer
Cut-off definition
The cut-off is measured in hours before the appointment start time in the business's timezone; the default is 120 hours (5 days). A cancellation made at or before the cut-off moment counts as "on time". Every message and page shows the exact cut-off date and time to the customer (e.g. "Free cancellation until 14:00 Fri 6 Nov").

Rules
ONLINE_FULL, cancelled on time: refund via Stripe. Booking becomes CANCELLED_REFUNDED.
ONLINE_FULL, cancelled late: no refund. Issue a credit voucher for the amount paid, valid for the configured number of days (default 10). Booking becomes CANCELLED_CREDIT.
ONLINE_DEPOSIT, cancelled on time: refund the deposit.
ONLINE_DEPOSIT, cancelled late: no refund. Issue a credit voucher for the deposit amount.
CASH_ON_DAY, cancelled at any time: nothing to refund. Record it as CANCELLED, plus a LATE_CANCEL flag if late.
Cancelling cancels the pending reminders, notifies the customer and principal, offers the slot to the waiting list (section 15), and writes an audit entry.
Refund fee policy (per business setting)
Option A, refund in full: the business absorbs the Stripe fee, which is deducted from its ledger.
Option B, refund minus the Stripe processing fee: the customer is told this in the terms before paying.
Fetch the actual Stripe fee from the charge's balance transaction rather than estimating it.
Credit vouchers
Statuses: ACTIVE, PARTIALLY_REDEEMED, REDEEMED, EXPIRED. Track the balance.
Redeemable against a new booking with the same business. When booking, the principal enters or scans the code, and the credit reduces the amount due. Any remainder is paid online or on the day.
Send an expiry warning 3 days before the voucher expires (configurable), with a link to rebook.
When a voucher expires, release the liability in the ledger according to the business's policy.
12. Cancellation by the business
The principal can cancel because of illness, weather, overbooking or similar. A reason is required, and the customer-facing reason is chosen from a list.
The cut-off never applies here. The customer is offered a choice via a link: a full refund (including any fee, absorbed by the business) or a free reschedule. If they don't respond within X days, refund automatically (configurable).
For cash bookings, the customer is simply notified and offered a reschedule.
Booking status: CANCELLED_BY_BUSINESS.
13. No-shows and customer flags
Customer fields: noShowCount, lateCancelCount, requiresPrepayment, trusted, and notes.
Business rule (configurable): after N no-shows or late cancels (default 2), automatically set requiresPrepayment. The principal can clear the flag or override it per booking (section 6).
Show the customer's history when creating a booking for them.
14. After the appointment
Some hours after the appointment (configurable), send a thank-you message with review links (Facebook / Google).
Never send it to no-shows, cancelled bookings, or customers who have opted out.
15. Waiting list
Customers can be added to a waiting list for a date/time window and service, either by the principal or through a public link the business shares.
When a slot frees up, notify the waiting customers in order (or all at once, by setting), with a booking link that holds the slot for X minutes. The first to confirm gets it.
16. Messaging
Build a channel abstraction (a NotificationService with Email, SMS and Messenger providers) so new channels can be added later (e.g. WhatsApp).
All messages are generated from templates (section 4) and rendered in the business's branding.
Facebook Messenger:
Uses a Meta app (requires app review) connected to each business's Facebook Page via OAuth.
Linking the customer: the principal has no Messenger ID (PSID) from the chat alone. The app generates an m.me link with a ref parameter, which the principal pastes into the Facebook conversation. When the customer taps it, the webhook receives their PSID with the ref and links it to the customer/booking automatically. Show the link status on the booking.
Respect Meta's 24-hour messaging window. Reminders outside the window must use an allowed message tag or utility template; if that is not possible, fall back to SMS/email and log why.
SMS: handle opt-out (STOP) and opt-in again. Use the business's sender ID where supported. Log every send with segment count and cost.
Email: SPF/DKIM set up via Resend, with an unsubscribe link for non-essential messages only.
Retries with backoff, delivery status webhooks (Twilio, Resend, Meta), and a message log viewable by the principal and Super Admin.
Marketing consent is stored separately from service messages. Booking/reminder messages are service messages.
17. Notifications to the principal
Real-time (email and/or SMS, and in-app): new payment, booking expired unpaid, customer cancellation, reschedule request, waiting-list booking, failed message delivery, Stripe dispute opened.
A daily summary each evening (time configurable): tomorrow's bookings, with payment status and any warnings.
Each user chooses in their settings which notifications they get.
18. Money handling: single Stripe account and manual payouts
All online payments are taken into the platform's single Stripe account. Each Checkout session and payment carries metadata (organisationId, bookingId) so every transaction can be traced to a company.

Ledger
A double-entry style ledger per organisation, with entries for:

customer payment (gross)
Stripe processing fee (actual, from the balance transaction)
platform fee: a configurable commission % per booking and/or a fixed monthly fee per organisation, set by the Super Admin
SMS charges, if passed on to the business (per-message price set by the Super Admin)
refunds (and the refunded fee, depending on the refund policy)
credit voucher liability created / released
dispute holds and outcomes
manual adjustments (Super Admin only, with a mandatory reason)
payouts made
The ledger gives a live "balance owed to this company". Cash taken in person is NOT in the ledger balance, because the business already holds that money, but it appears in reports.

Payouts (manual for now)
Super Admin screen: for each organisation, show the amount payable as of a date. Only money for appointments that have already taken place counts as payable; payments for future bookings are held, because they may still be refunded. The holding rule is configurable.
The Super Admin generates a payout statement (PDF + CSV) listing each booking, gross amount, fees, refunds, platform fee, SMS charges and the net payable.
After making the bank transfer manually, the Super Admin records the payout (amount, date, bank reference). Its line items are locked so they can't be paid twice.
The Owner can see their statements and payout history in their dashboard.
Design this so Stripe Connect automatic payouts could replace it later without changing the ledger.
Disputes/chargebacks
Handle the Stripe webhooks charge.dispute.created / updated / closed.
Flag the booking, notify the Owner and Super Admin, and put a hold on the disputed amount in the ledger.
Provide an evidence pack for the dispute: booking details, terms acceptance record, messages sent, voucher and attendance.
19. Receipts, invoices and VAT
Send a receipt for every payment (online or recorded on the day), branded per business.
If the business is VAT-registered, receipts show the VAT number and a VAT breakdown, with prices set as VAT-inclusive or exclusive per business.
Monthly statement/invoice from the platform to each business for platform fees and SMS charges.
20. Dashboards and reports
Principal
Calendar (day/week/month) and list views, filterable by status, payment status, service and staff
"Today" mobile view (section 9)
Booking detail: timeline of every event (created, messages sent, payments, reschedules, cancellation, terms acceptance)
Customer list with history and flags
Message log
Reports, exportable to CSV:
takings by method (online / cash / card in person) by day, week or month and by staff member
outstanding balances
credit vouchers outstanding
no-shows and cancellations
payout statements
Super Admin
Organisations list with status, onboarding progress and balance owed
Payouts screen (section 18)
Platform fee and SMS pricing settings
Dispute list
SMS/email usage and cost per organisation
Failed jobs/messages, with retry
Impersonate an organisation (read-only by default, audit-logged)
21. Data model (suggested; refine it)
Organisation, OrganisationSettings, User, Membership (role), Customer, Service, Resource, OpeningHours, ClosedDate, Booking, BookingEvent (timeline), Reschedule, Payment (method: STRIPE / CASH / CARD_IN_PERSON / BANK_TRANSFER / CREDIT_VOUCHER), Refund, Voucher (type: BOOKING or CREDIT, with balance), VoucherRedemption, TermsVersion, TermsAcceptance, ScheduledMessage, MessageLog, MessageTemplate, MessengerLink, WaitingListEntry, LedgerEntry, Payout, PayoutItem, Dispute, PlatformFeeConfig, AuditLog, Notification, NotificationPreference.

Every tenant-owned table has organisationId, and every query is scoped by it. Enforce this centrally (e.g. a Prisma extension) rather than in each query.
Booking fields include: status (PENDING_PAYMENT, CONFIRMED, COMPLETED, NO_SHOW, CANCELLED, CANCELLED_REFUNDED, CANCELLED_CREDIT, CANCELLED_BY_BUSINESS, EXPIRED), paymentMethod, paymentStatus (UNPAID, DEPOSIT_PAID, PART_PAID, PAID, REFUNDED, PARTIALLY_REFUNDED), amountDue, amountPaid, depositAmount, partySize, startsAt, endsAt, cutoffAt, lateCancel flag, override reasons.
22. Non-functional requirements
Security:
tenant isolation
signed and expiring customer links
Stripe, Twilio and Meta webhook signature verification
rate limiting on public endpoints
CSRF protection
secrets in env vars only
bank details encrypted at rest
least-privilege roles
UK GDPR: store only the data needed, a privacy policy page, customer data export and deletion (keeping financial records for the legally required period in anonymised form), and data retention settings.
Reliability: idempotent webhook and job handlers, retries with dead-letter handling, and Sentry error monitoring. Database backups (point-in-time recovery on the hosting provider) plus a documented restore procedure.
Accessibility (WCAG 2.1 AA) on customer-facing pages.
Seed script with demo data covering every booking state.
.env.example listing every variable.
Tests:
Vitest unit tests for the cut-off calculation (including the boundary and BST changeover), every combination of payment method × cancellation timing × refund fee policy, reschedule price differences, credit voucher redemption and expiry, the ledger balance and payable/held calculation, and reminder scheduling
Playwright tests for: creating a booking → paying → receiving the voucher → cancelling; cash on day → mark as paid; payment method override; business cancellation
README covering setup, running locally (Stripe CLI for webhooks, ngrok for Meta/Twilio webhooks), Meta app review steps, and deploying to Vercel.
23. Build phases
Project setup, auth, roles, multi-tenancy, Prisma schema, Super Admin skeleton
Organisation onboarding, settings, services, opening hours, resources
Booking CRUD, availability/double-booking checks, calendar and list views
Terms versioning and acceptance, customer booking page and manage links
Stripe payments (single account), webhooks, receipts
Vouchers (PDF + QR) and .ics files
Notification service: email, then SMS, then Messenger (including the PSID link flow)
Reminders and principal notifications/daily summary
Cash/deposit payments, payment method override, Today view, mark as paid
Rescheduling
Cancellations, refunds, refund fee policy, credit vouchers and expiry warnings, business cancellation
No-show rules, post-appointment review requests, waiting list
Ledger, platform fees, SMS charging, payout statements and manual payout recording, disputes
Reports, Super Admin dashboards, GDPR tools, monitoring, tests, polish
Start by asking me your clarifying questions, then show me the Prisma schema and folder structure before writing feature code.