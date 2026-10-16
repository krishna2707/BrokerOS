import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { UnitDto, BookingDto } from '@brokeros/types';

export function useUnitDetails(
  unit: UnitDto | null,
  isOpen: boolean,
  onSave: (unitId: string, updates: Partial<UnitDto> & { clearBooking?: boolean }) => Promise<void>,
  onClose: () => void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [booking, setBooking] = useState<BookingDto | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [possessionModalOpen, setPossessionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    status: unit?.status || 'AVAILABLE',
    basePrice: unit?.basePrice || 0,
    commissionPercentage: unit?.commissionPercentage || 0,
    commissionAmount: (Number(unit?.basePrice || 0) * Number(unit?.commissionPercentage || 0) / 100) || 0,
    carpetArea: unit?.carpetArea || 0,
    type: unit?.type || 'TWO_BHK',
    facing: unit?.facing || 'East',
  });

  useEffect(() => {
    if (isOpen && unit) {
      setFormData({
        status: unit.status || 'AVAILABLE',
        basePrice: unit.basePrice || 0,
        commissionPercentage: unit.commissionPercentage || 0,
        commissionAmount: (Number(unit.basePrice || 0) * Number(unit.commissionPercentage || 0) / 100) || 0,
        carpetArea: unit.carpetArea || 0,
        type: unit.type || 'TWO_BHK',
        facing: unit.facing || 'East',
      });
    }
  }, [isOpen, unit]);

  const fetchBooking = async () => {
    if (!unit) return;
    try {
      setLoadingBooking(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      const res = await fetch(`${apiUrl}/api/inventory/units/${unit.id}/booking`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBooking(false);
    }
  };

  useEffect(() => {
    if (isOpen && unit && (unit.status === 'RESERVED' || unit.status === 'SOLD')) {
      fetchBooking();
    } else {
      setBooking(null);
    }
  }, [isOpen, unit]);

  const handleSave = async () => {
    if (!unit) return;
    try {
      setIsSaving(true);
      await onSave(unit.id, formData as any);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save unit details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking || !unit) return;
    const reason = prompt("Enter reason for cancellation:");
    if (reason === null) return;

    try {
      setIsSaving(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';
      const res = await fetch(`${apiUrl}/api/leads/${booking.customer.leadId}/booking/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, reason })
      });
      if (res.ok) {
        // Trigger a fake "AVAILABLE" update to refresh grid and close drawer safely
        await onSave(unit.id, { ...formData, status: 'AVAILABLE', clearBooking: true } as any);
        onClose();
      } else {
        toast.error("Failed to cancel booking.");
      }
    } catch (e) {
      console.error(e);
      toast.error('Error cancelling booking');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    isSaving,
    booking,
    loadingBooking,
    formData,
    setFormData,
    possessionModalOpen,
    setPossessionModalOpen,
    handleSave,
    handleCancelBooking,
    refreshBooking: fetchBooking,
  };
}
