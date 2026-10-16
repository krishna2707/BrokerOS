// ============================================================================
// BrokerOS — Shared Booking & Post-Sales Domain Types
// ============================================================================

import type { UserSummaryDto } from './roles.js';
import type { UnitDto } from './inventory.js';

export type BookingStatus =
  | 'CONFIRMED'
  | 'DOCUMENTATION_PENDING'
  | 'PAYMENT_PENDING'
  | 'LOAN_IN_PROGRESS'
  | 'AGREEMENT_PENDING'
  | 'AGREEMENT_COMPLETED'
  | 'POSSESSION_PENDING'
  | 'HANDOVER_COMPLETED'
  | 'CANCELLED';

export type BookingSource = 'DIRECT' | 'CHANNEL_PARTNER';

export type DocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT_PHOTO'
  | 'ADDRESS_PROOF'
  | 'INCOME_DOCUMENT'
  | 'BOOKING_FORM'
  | 'AGREEMENT_COPY'
  | 'BANK_STATEMENT'
  | 'OTHER';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export type PaymentMode =
  | 'CASH'
  | 'CHEQUE'
  | 'NEFT'
  | 'RTGS'
  | 'UPI'
  | 'DEMAND_DRAFT'
  | 'OTHER';

export type LoanStatus =
  | 'NOT_APPLIED'
  | 'APPLIED'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'DISBURSED'
  | 'REJECTED';

export type AgreementStatus =
  | 'NOT_STARTED'
  | 'DRAFT_PREPARED'
  | 'STAMP_DUTY_PAID'
  | 'REGISTERED'
  | 'COMPLETED';

export type PossessionStatus =
  | 'NOT_READY'
  | 'READY'
  | 'SCHEDULED'
  | 'HANDED_OVER';

export interface CustomerDocumentDto {
  id: string;
  customerId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  status: DocumentVerificationStatus;
  verifiedById?: string | null;
  verifiedBy?: UserSummaryDto | null;
  verifiedAt?: string | Date | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
}

export interface CustomerDto {
  id: string;
  leadId?: string | null;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  panNumber?: string | null;
  aadhaarNumber?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  documents?: CustomerDocumentDto[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface PaymentScheduleItemDto {
  id: string;
  bookingId: string;
  milestoneName: string;
  dueDate: string | Date;
  dueAmount: number | string;
  amount?: number | string;
  remainingAmount?: number | string;
  paidAmount?: number | string;
  status: PaymentStatus | string;
  orderIndex: number;
}

export interface PaymentTransactionDto {
  id: string;
  bookingId: string;
  scheduleId?: string | null;
  amount: number | string;
  paymentMode: PaymentMode;
  transactionRef?: string | null;
  bankName?: string | null;
  paymentDate: string | Date;
  receiptNumber?: string | null;
  receiptUrl?: string | null;
  recordedById: string;
  recordedBy?: UserSummaryDto | null;
  createdAt: string | Date;
}

export interface LoanCaseDto {
  id: string;
  bookingId: string;
  bankName: string;
  branchName?: string | null;
  loanAmount: number | string;
  sanctionedAmount?: number | string | null;
  disbursedAmount?: number | string | null;
  status: LoanStatus;
  bankExecutiveName?: string | null;
  bankExecutivePhone?: string | null;
  applicationNumber?: string | null;
  appliedDate?: string | Date | null;
  sanctionedDate?: string | Date | null;
  disbursedDate?: string | Date | null;
}

export interface BookingDto {
  id: string;
  bookingNumber?: string;
  unitId: string;
  unit?: UnitDto | any | null;
  customerId?: string;
  customer?: CustomerDto | any | null;
  leadId?: string | null;
  brokerId?: string | null;
  broker?: {
    id: string;
    name: string;
    firmName?: string | null;
    companyName?: string | null;
    phone?: string;
  } | null;
  salesExecId?: string | null;
  salesExec?: UserSummaryDto | null;
  closingManagerId?: string | null;
  closingManager?: UserSummaryDto | null;
  postSalesId?: string | null;
  postSales?: UserSummaryDto | null;
  source?: BookingSource | string;
  status: BookingStatus | string;
  agreementPrice?: number | string;
  agreedPrice?: number | string;
  bookingAmount?: number | string;
  tokenAmount?: number | string;
  commissionPercentage?: number | string | null;
  commissionAmount?: number | string | null;
  paymentMode?: string | null;
  transactionRef?: string | null;
  unitDescription?: string | null;
  remarks?: string | null;
  loanRequired?: boolean | null;
  cancelReason?: string | null;
  cancellationReason?: string | null;
  bookingDate?: string | Date;
  cancelledAt?: string | Date | null;
  documents?: any[];
  brokerageRecords?: any[];
  paymentSchedules?: PaymentScheduleItemDto[];
  paymentSchedule?: PaymentScheduleItemDto[];
  paymentTransactions?: PaymentTransactionDto[];
  loanCase?: LoanCaseDto | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
