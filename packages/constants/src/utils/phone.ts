// ============================================================================
// BrokerOS — Standard Phone Utilities (E.164, Normalization & Sanitization)
// ============================================================================

/**
 * ITU-T E.164 Country Calling Codes (1, 2, and 3-digit).
 * Used for reliable international phone number detection across the globe.
 */
const ITU_COUNTRY_CODES_1 = new Set(['1', '7']);

const ITU_COUNTRY_CODES_2 = new Set([
  '20', '27',
  '30', '31', '32', '33', '34', '36', '39',
  '40', '41', '43', '44', '45', '46', '47', '48', '49',
  '51', '52', '53', '54', '55', '56', '57', '58',
  '60', '61', '62', '63', '64', '65', '66',
  '81', '82', '84', '86',
  '90', '91', '92', '93', '94', '95', '98',
]);

const ITU_COUNTRY_CODES_3 = new Set([
  // Africa
  '211', '212', '213', '216', '218',
  '220', '221', '222', '223', '224', '225', '226', '227', '228', '229',
  '230', '231', '232', '233', '234', '235', '236', '237', '238', '239',
  '240', '241', '242', '243', '244', '245', '246', '247', '248', '249',
  '250', '251', '252', '253', '254', '255', '256', '257', '258',
  '260', '261', '262', '263', '264', '265', '266', '267', '268', '269',
  '290', '291', '297', '298', '299',
  // Europe
  '350', '351', '352', '353', '354', '355', '356', '357', '358', '359',
  '370', '371', '372', '373', '374', '375', '376', '377', '378', '379',
  '380', '381', '382', '383', '385', '386', '387', '389',
  // Americas / Caribbean
  '500', '501', '502', '503', '504', '505', '506', '507', '508', '509',
  '590', '591', '592', '593', '594', '595', '596', '597', '598', '599',
  // Asia & Pacific
  '670', '672', '673', '674', '675', '676', '677', '678', '679',
  '680', '681', '682', '683', '685', '686', '687', '688', '689',
  '690', '691', '692',
  '850', '852', '853', '855', '856',
  '880', '886',
  // Middle East & Central Asia
  '960', '961', '962', '963', '964', '965', '966', '967', '968',
  '970', '971', '972', '973', '974', '975', '976', '977',
  '992', '993', '994', '995', '996', '998',
]);

/**
 * Global E.164 phone normalization across all BrokerOS modules.
 * Supports every international country code in the world (ITU-T E.164),
 * Excel scientific notation strings (e.g. 9.87654E+09), international direct
 * dialing prefixes (00 / 011), domestic trunk zeros (0), spaces, and punctuation.
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountryCode = '+91'): string {
  if (!rawPhone) return '';
  let str = String(rawPhone).trim();

  // 1. Handle Excel exponential notation (spreadsheets conversion)
  if (/[eE]\+?[0-9]+/.test(str)) {
    const num = Number(str);
    if (!isNaN(num) && isFinite(num)) {
      str = num.toLocaleString('fullwide', { useGrouping: false });
    }
  }

  // 2. Normalize default country code prefix
  const defaultDigits = (defaultCountryCode || '').replace(/\D/g, '') || '91';
  const cleanDefaultCc = `+${defaultDigits}`;

  const hasPlus = str.startsWith('+');
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  // 3. Already starts with '+' explicit E.164 indicator
  if (hasPlus) {
    return `+${digits}`;
  }

  // 4. International Direct Dialing (IDD) exit code:
  // Starts with '00' (most of Europe, Middle East, India, Asia, LatAm) -> e.g. 00971... -> +971...
  if (digits.startsWith('00') && digits.length >= 9) {
    return `+${digits.slice(2)}`;
  }
  // Starts with '011' (North America IDD) -> e.g. 01144... -> +44...
  if (digits.startsWith('011') && digits.length >= 10) {
    return `+${digits.slice(3)}`;
  }

  // 5. Domestic national trunk prefix '0' (e.g. 09876543210 in India, 0501234567 in UAE, 07911123456 in UK)
  // When a number starts with a single 0, it represents local national dialing.
  // Strip the leading 0 and prepend the default country code.
  if (digits.startsWith('0') && !digits.startsWith('00')) {
    const nationalPart = digits.replace(/^0+/, '');
    if (nationalPart) {
      return `${cleanDefaultCc}${nationalPart}`;
    }
  }

  // 6. Number already starts with default country code
  if (digits.startsWith(defaultDigits) && digits.length > defaultDigits.length + 5) {
    return `+${digits}`;
  }

  // 7. Standard domestic/national number (7 to 10 digits) without country code:
  // In almost every country, the domestic mobile/national number is 7-10 digits:
  // e.g. 10 digits in India ('9876543210'), USA ('4155552671'), 9 digits in UAE ('501234567'), 8 digits in SG/HK ('91234567').
  // Note: 10-digit numbers starting with '65' are Singapore international (65 + 8 digits).
  if (digits.length >= 7 && digits.length <= 10) {
    if (digits.length === 10 && digits.startsWith('65')) {
      return `+${digits}`;
    }
    return `${cleanDefaultCc}${digits}`;
  }

  // 8. International number without '+' (11 to 15 digits):
  // Check if it starts with recognized international calling code
  if (digits.length >= 11 && digits.length <= 15) {
    // 3-digit CCs (e.g. 971 UAE, 966 Saudi, 974 Qatar, 880 Bangladesh)
    if (ITU_COUNTRY_CODES_3.has(digits.slice(0, 3))) {
      return `+${digits}`;
    }
    // 2-digit CCs (e.g. 44 UK, 49 Germany, 33 France, 91 India, 92 Pakistan, 55 Brazil, 86 China)
    if (ITU_COUNTRY_CODES_2.has(digits.slice(0, 2))) {
      return `+${digits}`;
    }
    // 1-digit CCs (1 for US/Canada, 7 for Russia/Kazakhstan)
    if (digits.length === 11 && ITU_COUNTRY_CODES_1.has(digits.slice(0, 1))) {
      return `+${digits}`;
    }
  }

  // 9. Fallback: prepend '+'
  return `+${digits}`;
}


/**
 * Sanitize phone number for Meta WhatsApp Cloud API.
 * Meta requires digits only — no '+' prefix, no spaces, no dashes.
 * e.g. "+91 98765 43210" → "919876543210"
 */
export function sanitizePhoneForMeta(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Strips all non-digit characters for numeric comparisons.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Compares two phone numbers accounting for trunk prefixes.
 * Compares the last 10 digits (or 8 if shorter).
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const n1 = normalizePhone(phone1);
  const n2 = normalizePhone(phone2);
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  if (n1.length >= 10 && n2.length >= 10) {
    return n1.slice(-10) === n2.slice(-10);
  }
  if (n1.length >= 8 && n2.length >= 8) {
    return n1.slice(-8) === n2.slice(-8);
  }
  return false;
}

/**
 * Validates whether a phone number matches standard E.164 pattern (7-15 digits).
 */
export function isValidE164(phone: string): boolean {
  if (!phone) return false;
  return /^\+?[1-9]\d{6,14}$/.test(phone.trim());
}

/**
 * Generates retry variants (with/without trunk prefix) when carrier or Meta rejects a recipient.
 */
export function phoneVariants(sanitized: string): string[] {
  if (!sanitized) return [];
  const seen = new Set<string>();
  const push = (v: string) => {
    if (v && !seen.has(v)) seen.add(v);
  };

  // 1. Original
  push(sanitized);

  // 2. Insert a 0 after each plausible country-code length (1, 2, 3 digits)
  for (const ccLen of [1, 2, 3]) {
    if (sanitized.length <= ccLen) continue;
    const cc = sanitized.slice(0, ccLen);
    const rest = sanitized.slice(ccLen);
    if (!rest.startsWith('0')) {
      push(cc + '0' + rest);
    }
  }

  // 3. Remove a leading 0 after each plausible country-code length
  for (const ccLen of [1, 2, 3]) {
    if (sanitized.length <= ccLen + 1) continue;
    const cc = sanitized.slice(0, ccLen);
    const rest = sanitized.slice(ccLen);
    if (rest.startsWith('0')) {
      push(cc + rest.slice(1));
    }
  }

  // 4. Indian 10-digit / 12-digit variants
  if (sanitized.startsWith('91') && sanitized.length === 12) {
    push(sanitized.slice(2)); // 10 digit variant
  } else if (sanitized.length === 10) {
    push(`91${sanitized}`); // 12 digit variant
  }

  return Array.from(seen);
}

/**
 * Returns true when a provider or Meta API error indicates the recipient
 * phone number isn't in the allowed list or recipient not allowed.
 */
export function isRecipientNotAllowedError(message: string): boolean {
  if (!message) return false;
  return /131026|131030|not in allowed list|not in the allowed list|recipient not allowed/i.test(
    message,
  );
}

