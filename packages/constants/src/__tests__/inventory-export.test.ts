import { describe, it, expect } from 'vitest';
import {
  formatInventoryToCsv,
  INVENTORY_EXPORT_HEADERS,
} from '../export.js';

describe('formatInventoryToCsv', () => {
  it('should export correct headers when towers list is empty', () => {
    const csv = formatInventoryToCsv([], 'Test Project');
    const headers = INVENTORY_EXPORT_HEADERS.map((h) => h.label).join(',');
    expect(csv).toBe(headers);
  });

  it('should format unit details across floors and towers', () => {
    const mockTowers = [
      {
        id: 'tower-1',
        name: 'Tower A',
        floors: [
          {
            floorNumber: 1,
            units: [
              {
                unitNumber: '101',
                type: 'TWO_BHK',
                status: 'AVAILABLE',
                carpetArea: 850,
                builtUpArea: 1050,
                superBuiltUpArea: 1200,
                facing: 'East',
                balconies: 2,
                parkingIncluded: true,
                basePrice: 7500000,
                pricePerSqFt: 6250,
                totalPrice: 8000000,
                constructionStatus: 'READY_TO_MOVE',
                remarks: 'Garden facing, premium view',
              },
            ],
          },
        ],
      },
    ];

    const csv = formatInventoryToCsv(mockTowers, 'Grand Residency');
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(2);

    const dataRow = lines[1];
    expect(dataRow).toContain('Grand Residency');
    expect(dataRow).toContain('Tower A');
    expect(dataRow).toContain('101');
    expect(dataRow).toContain('2 BHK');
    expect(dataRow).toContain('AVAILABLE');
    expect(dataRow).toContain('Yes');
    expect(dataRow).toContain('"Garden facing, premium view"');
  });

  it('should format SOLD units with customer and booking details', () => {
    const mockTowers = [
      {
        name: 'Tower B',
        floors: [
          {
            floorNumber: 5,
            units: [
              {
                unitNumber: '504',
                type: 'THREE_BHK',
                status: 'SOLD',
                carpetArea: 1250,
                totalPrice: 12000000,
                bookings: [
                  {
                    bookingNumber: 'BK-9921',
                    agreedPrice: 11800000,
                    bookingDate: '2026-04-10T10:00:00.000Z',
                    customer: {
                      firstName: 'Rajesh',
                      lastName: 'Kumar',
                      phone: '+919876543210',
                      email: 'rajesh.kumar@example.com',
                    },
                    salesExec: {
                      name: 'Vikram Malhotra',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const csv = formatInventoryToCsv(mockTowers, 'Skyline Heights');
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(2);

    const dataRow = lines[1];
    expect(dataRow).toContain('Rajesh Kumar');
    expect(dataRow).toContain('+919876543210');
    expect(dataRow).toContain('rajesh.kumar@example.com');
    expect(dataRow).toContain('BK-9921');
    expect(dataRow).toContain('11800000');
    expect(dataRow).toContain('2026-04-10');
    expect(dataRow).toContain('Vikram Malhotra');
  });

  it('should format RESERVED and BLOCKED units with agent info and dates', () => {
    const mockTowers = [
      {
        name: 'Tower C',
        floors: [
          {
            floorNumber: 2,
            units: [
              {
                unitNumber: '201',
                type: 'ONE_BHK',
                status: 'RESERVED',
                reservedAt: '2026-05-15T14:30:00.000Z',
                reservedFor: {
                  name: 'Ananya Roy',
                  phone: '+919811122233',
                  email: 'ananya@brokeros.com',
                },
              },
              {
                unitNumber: '202',
                type: 'STUDIO',
                status: 'BLOCKED',
                blockedAt: '2026-05-16T09:00:00.000Z',
                blockedBy: {
                  name: 'Suresh Patel',
                  phone: '+919844455566',
                  email: 'suresh@brokeros.com',
                },
              },
            ],
          },
        ],
      },
    ];

    const csv = formatInventoryToCsv(mockTowers, 'Imperial Towers');
    const lines = csv.split('\r\n');
    expect(lines.length).toBe(3);

    // Reserved row
    expect(lines[1]).toContain('Ananya Roy');
    expect(lines[1]).toContain('2026-05-15');
    expect(lines[1]).toContain('RESERVED');

    // Blocked row
    expect(lines[2]).toContain('Suresh Patel');
    expect(lines[2]).toContain('2026-05-16');
    expect(lines[2]).toContain('BLOCKED');
  });

  it('should properly escape cells with quotes, commas, and newlines', () => {
    const mockTowers = [
      {
        name: 'Tower "Luxury"',
        floors: [
          {
            floorNumber: 1,
            units: [
              {
                unitNumber: '101',
                type: 'PENTHOUSE',
                status: 'AVAILABLE',
                remarks: 'Line 1\nLine 2, with "quotes"',
              },
            ],
          },
        ],
      },
    ];

    const csv = formatInventoryToCsv(mockTowers, 'Project, Special "Edition"');
    expect(csv).toContain('"Project, Special ""Edition"""');
    expect(csv).toContain('"Tower ""Luxury"""');
    expect(csv).toContain('"Line 1\nLine 2, with ""quotes"""');
  });
});
