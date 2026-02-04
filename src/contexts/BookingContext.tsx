import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { sharePointService } from '../services/SharePointService';
import { bookingService } from '../services/BookingService';
import { Booking, BookingFormData, FilterCriteria } from '../types/Booking';
import { useAuth } from './AuthContext';

interface BookingContextValue {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  filters: FilterCriteria;
  showAllBookings: boolean;
  setShowAllBookings: (show: boolean) => void;
  fetchBookings: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  setFilters: (filters: FilterCriteria) => void;
  createBooking: (data: BookingFormData, onBehalfOf?: { name: string; email: string }) => Promise<void>;
  updateBooking: (id: number, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: number) => Promise<void>;
  clearError: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<FilterCriteria>({});
  const [showAllBookings, setShowAllBookingsState] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      // Apply showAllBookings flag to filters (available to all users)
      const effectiveFilters: FilterCriteria = {
        ...filters,
        showAllBookings: showAllBookings,
      };
      const data = await sharePointService.getBookings(effectiveFilters);
      setBookings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      console.error('Fetch bookings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, showAllBookings]);

  const refreshBookings = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  const setFilters = useCallback((newFilters: FilterCriteria) => {
    setFiltersState(newFilters);
  }, []);

  const setShowAllBookings = useCallback((show: boolean) => {
    setShowAllBookingsState(show);
  }, []);

  const createBooking = useCallback(
    async (data: BookingFormData, onBehalfOf?: { name: string; email: string }) => {
      if (!user) throw new Error('User not authenticated');

      const bookingUser = onBehalfOf || { name: user.displayName, email: user.email };

      try {
        setIsLoading(true);
        setError(null);

        // Use BookingService which handles:
        // - SharePoint creation
        // - Calendar event creation
        // - AM confirmation email
        // - Manager notification email with deep link
        // - Audit logging
        const createData = {
          clientName: data.clientName,
          bookingType: data.bookingType,
          licenseCount: data.licenseCount,
          proposedSlot1: data.proposedSlot1.toISOString(),
          proposedSlot2: data.proposedSlot2.toISOString(),
          proposedSlot3: data.proposedSlot3.toISOString(),
          comments: data.comments,
          isPremiumClient: data.isPremiumClient,
          dealSize: data.dealSize,
          dealValue: data.dealValue,
          priority: data.priority,
        };
        const result = await bookingService.createBooking(createData, bookingUser.email, bookingUser.name);

        if (!result.success) {
          throw new Error(result.error || 'Failed to create booking');
        }

        // Show warnings if any (e.g., calendar event failed but booking was created)
        if (result.warnings && result.warnings.length > 0) {
          setError(result.warnings.join('. '));
        }

        // Refresh bookings list
        await fetchBookings();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchBookings]
  );

  const updateBooking = useCallback(
    async (id: number, updates: Partial<Booking>) => {
      try {
        setIsLoading(true);
        setError(null);
        await sharePointService.updateBooking(id, updates);
        await fetchBookings();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update booking';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchBookings]
  );

  const deleteBooking = useCallback(
    async (id: number) => {
      try {
        setIsLoading(true);
        setError(null);
        await sharePointService.deleteBooking(id);
        setBookings((prev) => prev.filter((b) => b.Id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete booking';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: BookingContextValue = useMemo(
    () => ({
      bookings,
      isLoading,
      error,
      filters,
      showAllBookings,
      setShowAllBookings,
      fetchBookings,
      refreshBookings,
      setFilters,
      createBooking,
      updateBooking,
      deleteBooking,
      clearError,
    }),
    [
      bookings,
      isLoading,
      error,
      filters,
      showAllBookings,
      setShowAllBookings,
      fetchBookings,
      refreshBookings,
      setFilters,
      createBooking,
      updateBooking,
      deleteBooking,
      clearError,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within BookingProvider');
  }
  return context;
};
