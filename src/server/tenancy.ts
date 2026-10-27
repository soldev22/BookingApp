const TENANT_MODELS = new Set([
  "OrganisationSettings",
  "Customer",
  "Service",
  "Resource",
  "OpeningHours",
  "ClosedDate",
  "BlockedTime",
  "Booking",
  "BookingEvent",
  "Reschedule",
  "Payment",
  "Refund",
  "Voucher",
  "VoucherRedemption",
  "TermsVersion",
  "TermsAcceptance",
  "MessageTemplate",
  "ScheduledMessage",
  "MessageLog",
  "MessengerLink",
  "WaitingListEntry",
  "SlotHold",
  "LedgerTransaction",
  "LedgerEntry",
  "Payout",
  "Dispute",
  "AuditLog",
  "Notification",
  "NotificationPreference",
  "Job",
]);

export function assertTenantModel(model: string, organisationId?: string) {
  if (TENANT_MODELS.has(model) && !organisationId) {
    throw new Error(`Tenant context is required for ${model}`);
  }
}

export function tenantWhere<T extends Record<string, unknown>>(
  organisationId: string,
  where?: T,
) {
  if (!organisationId) throw new Error("Organisation ID is required");
  return { ...where, organisationId };
}

export function tenantCreate<T extends Record<string, unknown>>(
  organisationId: string,
  data: T,
) {
  if (!organisationId) throw new Error("Organisation ID is required");
  return { ...data, organisationId };
}
