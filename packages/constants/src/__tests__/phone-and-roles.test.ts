import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  sanitizePhoneForMeta,
  normalizePhone,
  phonesMatch,
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
  ROLES,
  ROLE_CODES,
  isCpRole,
  isBrokerageRole,
  isManagementRole,
} from '../index.js';

describe('Phone Utilities', () => {
  it('normalizes 10-digit Indian numbers with +91', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber(' 9876543210 ')).toBe('+919876543210');
  });

  it('normalizes numbers already starting with +', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    expect(normalizePhoneNumber('+14155552671')).toBe('+14155552671');
  });

  it('normalizes 12-digit Indian numbers starting with 91', () => {
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  it('handles Excel exponential notation numbers', () => {
    expect(normalizePhoneNumber('9.8765432100E+09')).toBe('+919876543210');
  });

  it('handles domestic trunk 0 prefix across countries', () => {
    expect(normalizePhoneNumber('09876543210', '+91')).toBe('+919876543210');
    expect(normalizePhoneNumber('07911123456', '+44')).toBe('+447911123456');
    expect(normalizePhoneNumber('0501234567', '+971')).toBe('+971501234567');
    expect(normalizePhoneNumber('0412345678', '+61')).toBe('+61412345678');
    expect(normalizePhoneNumber('01701234567', '+49')).toBe('+491701234567');
  });

  it('handles international numbers across global country codes without +', () => {
    // UAE (+971) 12 digits
    expect(normalizePhoneNumber('971501234567')).toBe('+971501234567');
    // Saudi Arabia (+966) 12 digits
    expect(normalizePhoneNumber('966501234567')).toBe('+966501234567');
    // United Kingdom (+44) 12 digits
    expect(normalizePhoneNumber('447911123456')).toBe('+447911123456');
    // United States / Canada (+1) 11 digits
    expect(normalizePhoneNumber('14155552671')).toBe('+14155552671');
    // France (+33) 11 digits
    expect(normalizePhoneNumber('33612345678')).toBe('+33612345678');
    // Australia (+61) 11 digits
    expect(normalizePhoneNumber('61412345678')).toBe('+61412345678');
    // Singapore (+65) 10 digits
    expect(normalizePhoneNumber('6591234567')).toBe('+6591234567');
    // Qatar (+974) 11 digits
    expect(normalizePhoneNumber('97433123456')).toBe('+97433123456');
    // Bangladesh (+880) 13 digits
    expect(normalizePhoneNumber('8801712345678')).toBe('+8801712345678');
    // Pakistan (+92) 12 digits
    expect(normalizePhoneNumber('923001234567')).toBe('+923001234567');
  });

  it('handles International Direct Dialing (IDD) prefixes (00 and 011)', () => {
    expect(normalizePhoneNumber('00971501234567')).toBe('+971501234567');
    expect(normalizePhoneNumber('00447911123456')).toBe('+447911123456');
    expect(normalizePhoneNumber('011447911123456')).toBe('+447911123456');
    expect(normalizePhoneNumber('011919876543210')).toBe('+919876543210');
  });

  it('normalizes domestic numbers for non-India defaultCountryCodes', () => {
    // UAE 9-digit mobile
    expect(normalizePhoneNumber('501234567', '+971')).toBe('+971501234567');
    // Singapore 8-digit mobile
    expect(normalizePhoneNumber('91234567', '+65')).toBe('+6591234567');
    // US 10-digit number
    expect(normalizePhoneNumber('4155552671', '+1')).toBe('+14155552671');
  });

  it('sanitizes phone numbers for Meta (digits only, no +)', () => {
    expect(sanitizePhoneForMeta('+91 98765-43210')).toBe('919876543210');
  });

  it('verifies phone matches accounting for trunk formats', () => {
    expect(phonesMatch('+919876543210', '9876543210')).toBe(true);
    expect(phonesMatch('09876543210', '+919876543210')).toBe(true);
    expect(phonesMatch('9876543210', '9123456789')).toBe(false);
  });

  it('validates E.164 formats', () => {
    expect(isValidE164('+919876543210')).toBe(true);
    expect(isValidE164('9876543210')).toBe(true);
    expect(isValidE164('123')).toBe(false);
    expect(isValidE164('')).toBe(false);
  });

  it('generates phone variants for retry including trunk prefixes', () => {
    const variants = phoneVariants('919876543210');
    expect(variants).toContain('919876543210');
    expect(variants).toContain('9876543210');

    const trunkVariants = phoneVariants('9109800000000');
    expect(trunkVariants).toContain('9109800000000');
    expect(trunkVariants).toContain('919800000000');
  });

  it('detects recipient not allowed errors from providers/Meta', () => {
    expect(isRecipientNotAllowedError('Error code 131026: message undeliverable')).toBe(true);
    expect(isRecipientNotAllowedError('User is not in allowed list')).toBe(true);
    expect(isRecipientNotAllowedError('recipient not allowed')).toBe(true);
    expect(isRecipientNotAllowedError('Rate limit exceeded')).toBe(false);
    expect(isRecipientNotAllowedError('')).toBe(false);
  });
});


describe('Role System Constants', () => {
  it('contains all 14 official system roles', () => {
    expect(ROLES).toHaveLength(14);
    expect(ROLE_CODES).toHaveLength(14);
  });

  it('correctly classifies CP roles', () => {
    expect(isCpRole('CHANNEL_PARTNER')).toBe(true);
    expect(isCpRole('SOURCING_MANAGER')).toBe(true);
    expect(isCpRole('CLOSING_MANAGER')).toBe(true);
    expect(isCpRole('SALES_EXECUTIVE')).toBe(false);
  });

  it('correctly classifies Brokerage roles', () => {
    expect(isBrokerageRole('PRE_SALES')).toBe(true);
    expect(isBrokerageRole('SALES_EXECUTIVE')).toBe(true);
    expect(isBrokerageRole('POST_SALES')).toBe(true);
    expect(isBrokerageRole('CHANNEL_PARTNER')).toBe(false);
  });

  it('correctly classifies Management roles', () => {
    expect(isManagementRole('PRE_SALES_MANAGER')).toBe(true);
    expect(isManagementRole('SALES_MANAGER')).toBe(true);
    expect(isManagementRole('ADMIN')).toBe(true);
    expect(isManagementRole('PRE_SALES')).toBe(false);
  });
});
