/**
 * BookingService - Orchestration layer for booking operations
 *
 * This service coordinates all booking-related operations including:
 * - SharePoint data persistence
 * - Calendar event management
 * - Email notifications
 * - Audit logging
 * - Conflict detection
 * - Duplicate prevention
 */

import { sharePointService } from './SharePointService';
import { getGraphService } from './serviceFactory';
import { notificationService } from './NotificationService';
import { auditService } from './AuditService';
import { Booking, BookingStatus, CreateBookingData } from '../types/Booking';
import { CalendarEvent } from '../types/ApiResponses';
import { addHours, format } from 'date-fns';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();

export interface BookingResult {
  success: boolean;
  booking?: Booking;
  calendarEventId?: string;
  error?: string;
  warnings?: string[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: CalendarEvent[];
  slot: string;
}

export interface ApprovalResult {
  success: boolean;
  booking?: Booking;
  calendarEventUpdated: boolean;
  notificationSent: boolean;
  error?: string;
  warnings?: string[];
}

export interface RescheduleResult {
  success: boolean;
  booking?: Booking;
  oldCalendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  booking?: Booking;
  calendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}

export interface DeletionResult {
  success: boolean;
  calendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}

class BookingService {
  /**
   * Create a new booking with full workflow orchestration
   */
  async createBooking(
    data: CreateBookingData,
    userEmail: string,
    userName: string
  ): Promise<BookingResult> {
    const warnings: string[] = [];
    let calendarEventId: string | undefined;

    try {
      // 1. Check for duplicate bookings
      const duplicateCheck = await this.checkForDuplicateBooking(
        data.clientName,
        data.proposedSlot1,
        userEmail
      );

      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          error: `A similar booking already exists for ${data.clientName} around this time. Please check your existing bookings.`,
          warnings,
        };
      }

      // 2. Check for calendar conflicts on all proposed slots
      const conflictResults = await this.checkSlotsForConflicts([
        { slot: data.proposedSlot1, label: 'Slot 1' },
        { slot: data.proposedSlot2, label: 'Slot 2' },
        { slot: data.proposedSlot3, label: 'Slot 3' },
      ]);

      const conflictWarnings = conflictResults
        .filter((r) => r.hasConflict)
        .map((r) => `${r.slot} has calendar conflicts`);

      if (conflictWarnings.length > 0) {
        warnings.push(...conflictWarnings);
      }

      // 3. Create booking directly in SharePoint
      // Convert CreateBookingData (string dates) to BookingFormData (Date objects)
      const formData = {
        clientName: data.clientName,
        bookingType: data.bookingType,
        licenseCount: data.licenseCount,
        proposedSlot1: new Date(data.proposedSlot1),
        proposedSlot2: new Date(data.proposedSlot2),
        proposedSlot3: new Date(data.proposedSlot3),
        comments: data.comments,
        isPremiumClient: data.isPremiumClient,
        dealSize: data.dealSize,
        dealValue: data.dealValue,
        priority: data.priority,
      };

      const booking = await sharePointService.createBooking(
        formData,
        { name: userName, email: userEmail }
      );

      if (!booking) {
        return {
          success: false,
          error: 'Failed to create booking in SharePoint',
          warnings,
        };
      }

      // 5. Create calendar event
      try {
        const eventDuration = data.bookingType === 'Deployment' ? 2 : 1; // 2 hours for deployment, 1 for demo
        const startTime = new Date(data.proposedSlot1);
        const endTime = addHours(startTime, eventDuration);

        const eventBody = this.buildCalendarEventBody(booking, [
          data.proposedSlot1,
          data.proposedSlot2,
          data.proposedSlot3,
        ]);

        let calendarEvent: CalendarEvent | undefined;

        try {
          calendarEvent = await graphService.createCalendarEvent({
            subject: `LP ${data.bookingType}: ${data.clientName}`,
            start: startTime,
            end: endTime,
            body: eventBody,
            location: 'Microsoft Teams',
            attendees: [userEmail],
          });
        } catch {
          // Fall back to personal calendar
          calendarEvent = await graphService.createMyCalendarEvent({
            subject: `LP ${data.bookingType}: ${data.clientName}`,
            start: startTime,
            end: endTime,
            body: eventBody,
            location: 'Microsoft Teams',
            attendees: [userEmail],
          });
          warnings.push('Calendar event created in personal calendar (shared calendar unavailable)');
        }

        if (calendarEvent?.id) {
          calendarEventId = calendarEvent.id;

          // 6. Store calendar event ID back to SharePoint
          await sharePointService.updateBooking(booking.Id, {
            CalendarEventId: calendarEventId,
          });
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError);
        warnings.push('Calendar event could not be created');
      }

      // 7. Send confirmation notification to Account Manager
      try {
        await notificationService.sendBookingCreatedNotification(booking, userEmail);
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        warnings.push('Confirmation email could not be sent');
      }

      // 8. Send notification to ALL managers about the new booking
      try {
        const managerResult = await notificationService.sendNewBookingToManagersNotification(booking, userName);
        if (!managerResult.success) {
          warnings.push('Manager notification could not be sent');
        }
      } catch (managerNotifyError) {
        console.error('Failed to send manager notification:', managerNotifyError);
        warnings.push('Manager notification could not be sent');
      }

      // 9. Audit log
      try {
        await auditService.logCreate('Booking', booking.Id, booking.ClientName, {
          clientName: booking.ClientName,
          bookingType: booking.BookingType,
          status: booking.Status,
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      return {
        success: true,
        booking,
        calendarEventId,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Booking creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
        warnings,
      };
    }
  }

  /**
   * Approve a booking - sets confirmed time, updates calendar, sends notifications
   */
  async approveBooking(
    bookingId: number,
    confirmedSlot: string,
    comments: string,
    _approverEmail: string,
    approverName: string
  ): Promise<ApprovalResult> {
    let calendarEventUpdated = false;
    let notificationSent = false;
    const warnings: string[] = [];

    try {
      // 1. Get current booking
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          calendarEventUpdated,
          notificationSent,
        };
      }

      // 2. Check for conflicts on the confirmed slot (non-blocking)
      const startTime = new Date(confirmedSlot);
      const endTime = addHours(startTime, booking.BookingType === 'Deployment' ? 2 : 1);

      try {
        const conflictCheck = await graphService.checkCalendarConflicts(
          startTime,
          endTime,
          booking.CalendarEventId
        );

        if (conflictCheck.hasConflict) {
          console.warn(`Calendar conflict detected for booking ${bookingId}: ${conflictCheck.conflicts.length} event(s)`);
          // Warn but don't block — manager has already chosen to approve
        }
      } catch (conflictError) {
        console.warn('Calendar conflict check failed, proceeding with approval:', conflictError);
      }

      // 3. Update booking in SharePoint
      await sharePointService.updateBooking(bookingId, {
        Status: 'Confirmed',
        ConfirmedDateTime: confirmedSlot,
        Outcome: comments || `Approved by ${approverName}`,
      });

      // 4. Update or create calendar event
      try {
        const eventBody = this.buildConfirmedCalendarEventBody(booking, confirmedSlot, approverName);

        // Build attendees list: Account Manager + Assigned Specialist (if any)
        const attendees: string[] = [booking.AccountManagerEmail];
        if (booking.AssignedSpecialistEmail) {
          attendees.push(booking.AssignedSpecialistEmail);
        }

        if (booking.CalendarEventId) {
          // Update existing event
          try {
            await graphService.updateCalendarEvent(booking.CalendarEventId, {
              subject: `LP ${booking.BookingType}: ${booking.ClientName} [CONFIRMED]`,
              start: startTime,
              end: endTime,
              body: eventBody,
              attendees,
            });
            calendarEventUpdated = true;
          } catch {
            // Try personal calendar
            await graphService.updateMyCalendarEvent(booking.CalendarEventId, {
              subject: `LP ${booking.BookingType}: ${booking.ClientName} [CONFIRMED]`,
              start: startTime,
              end: endTime,
              body: eventBody,
              attendees,
            });
            calendarEventUpdated = true;
          }
        } else {
          // Create new event if none exists
          try {
            const newEvent = await graphService.createCalendarEvent({
              subject: `LP ${booking.BookingType}: ${booking.ClientName} [CONFIRMED]`,
              start: startTime,
              end: endTime,
              body: eventBody,
              location: 'Microsoft Teams',
              attendees,
            });

            if (newEvent?.id) {
              await sharePointService.updateBooking(bookingId, {
                CalendarEventId: newEvent.id,
              });
              calendarEventUpdated = true;
            }
          } catch {
            const newEvent = await graphService.createMyCalendarEvent({
              subject: `LP ${booking.BookingType}: ${booking.ClientName} [CONFIRMED]`,
              start: startTime,
              end: endTime,
              body: eventBody,
              location: 'Microsoft Teams',
              attendees,
            });

            if (newEvent?.id) {
              await sharePointService.updateBooking(bookingId, {
                CalendarEventId: newEvent.id,
              });
              calendarEventUpdated = true;
            }
          }
        }
      } catch (calendarError) {
        console.error('Failed to update calendar event:', calendarError);
        const errorMsg = calendarError instanceof Error ? calendarError.message : 'Unknown calendar error';
        warnings.push(`Calendar event could not be created/updated: ${errorMsg}. The booking is confirmed but you may need to manually add it to the calendar.`);
      }

      // 5. Send approval notification
      try {
        const updatedBooking = await sharePointService.getBookingById(bookingId);
        if (updatedBooking) {
          await notificationService.sendBookingApprovedNotification(
            updatedBooking,
            confirmedSlot,
            approverName
          );
          notificationSent = true;
        }
      } catch (notifyError) {
        console.error('Failed to send approval notification:', notifyError);
        warnings.push('Confirmation email could not be sent to the Account Manager.');
      }

      // 6. Audit log
      try {
        await auditService.logUpdate('Booking', bookingId, booking.ClientName, {
          previousStatus: booking.Status,
        }, {
          action: 'Approved',
          confirmedSlot,
          approvedBy: approverName,
          status: 'Confirmed',
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      const updatedBooking = await sharePointService.getBookingById(bookingId);
      return {
        success: true,
        booking: updatedBooking || undefined,
        calendarEventUpdated,
        notificationSent,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Booking approval failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve booking',
        calendarEventUpdated,
        notificationSent,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  }

  /**
   * Reject a booking - updates status, deletes calendar event, sends notifications
   */
  async rejectBooking(
    bookingId: number,
    reason: string,
    _rejecterEmail: string,
    rejecterName: string
  ): Promise<ApprovalResult> {
    let calendarEventUpdated = false;
    let notificationSent = false;

    try {
      // 1. Get current booking
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          calendarEventUpdated,
          notificationSent,
        };
      }

      // 2. Update booking in SharePoint
      await sharePointService.updateBooking(bookingId, {
        Status: 'Cancelled',
        Outcome: `Rejected by ${rejecterName}: ${reason}`,
      });

      // 3. Delete calendar event if exists
      if (booking.CalendarEventId) {
        try {
          await graphService.deleteCalendarEvent(booking.CalendarEventId);
          calendarEventUpdated = true;
        } catch {
          try {
            await graphService.deleteMyCalendarEvent(booking.CalendarEventId);
            calendarEventUpdated = true;
          } catch (deleteError) {
            console.error('Failed to delete calendar event:', deleteError);
          }
        }
      }

      // 4. Send rejection notification
      try {
        await notificationService.sendBookingRejectedNotification(booking, reason, rejecterName);
        notificationSent = true;
      } catch (notifyError) {
        console.error('Failed to send rejection notification:', notifyError);
      }

      // 5. Audit log
      try {
        await auditService.logUpdate('Booking', bookingId, booking.ClientName, {
          previousStatus: booking.Status,
        }, {
          action: 'Rejected',
          reason,
          rejectedBy: rejecterName,
          status: 'Cancelled',
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      const updatedBooking = await sharePointService.getBookingById(bookingId);
      return {
        success: true,
        booking: updatedBooking || undefined,
        calendarEventUpdated,
        notificationSent,
      };
    } catch (error) {
      console.error('Booking rejection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject booking',
        calendarEventUpdated,
        notificationSent,
      };
    }
  }

  /**
   * Reschedule a booking - updates slots, manages calendar, sends notifications
   */
  async rescheduleBooking(
    bookingId: number,
    newSlots: { slot1: Date; slot2: Date; slot3: Date },
    reason: string,
    _userEmail: string,
    userName: string
  ): Promise<RescheduleResult> {
    let oldCalendarEventDeleted = false;
    let notificationSent = false;

    try {
      // 1. Get current booking
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          oldCalendarEventDeleted,
          notificationSent,
        };
      }

      // 2. Delete old calendar event
      if (booking.CalendarEventId) {
        try {
          await graphService.deleteCalendarEvent(booking.CalendarEventId);
          oldCalendarEventDeleted = true;
        } catch {
          try {
            await graphService.deleteMyCalendarEvent(booking.CalendarEventId);
            oldCalendarEventDeleted = true;
          } catch (deleteError) {
            console.error('Failed to delete old calendar event:', deleteError);
          }
        }
      }

      // 3. Update booking in SharePoint
      // Note: We keep the AssignedSpecialist fields for reference during re-approval,
      // but the manager can reassign if needed when approving the new time slot
      const previousSlots = {
        slot1: booking.ProposedSlot1,
        slot2: booking.ProposedSlot2,
        slot3: booking.ProposedSlot3,
      };

      await sharePointService.updateBooking(bookingId, {
        Status: 'Rescheduling Required',
        ProposedSlot1: newSlots.slot1.toISOString(),
        ProposedSlot2: newSlots.slot2.toISOString(),
        ProposedSlot3: newSlots.slot3.toISOString(),
        ConfirmedDateTime: undefined, // Clear confirmed date
        CalendarEventId: undefined, // Clear old event ID
        Comments: reason ? `Reschedule reason: ${reason}\n\nOriginal comments: ${booking.Comments || 'None'}` : booking.Comments,
      });

      // 4. Create new calendar event for first proposed slot
      try {
        const startTime = newSlots.slot1;
        const endTime = addHours(startTime, booking.BookingType === 'Deployment' ? 2 : 1);

        const eventBody = this.buildRescheduleCalendarEventBody(
          booking,
          [newSlots.slot1.toISOString(), newSlots.slot2.toISOString(), newSlots.slot3.toISOString()],
          reason
        );

        // Build attendees list: Account Manager + Assigned Specialist (if any)
        const attendees: string[] = [booking.AccountManagerEmail];
        if (booking.AssignedSpecialistEmail) {
          attendees.push(booking.AssignedSpecialistEmail);
        }

        let newEvent: CalendarEvent | undefined;
        try {
          newEvent = await graphService.createCalendarEvent({
            subject: `LP ${booking.BookingType}: ${booking.ClientName} [RESCHEDULING]`,
            start: startTime,
            end: endTime,
            body: eventBody,
            location: 'Microsoft Teams',
            attendees,
          });
        } catch {
          newEvent = await graphService.createMyCalendarEvent({
            subject: `LP ${booking.BookingType}: ${booking.ClientName} [RESCHEDULING]`,
            start: startTime,
            end: endTime,
            body: eventBody,
            location: 'Microsoft Teams',
            attendees,
          });
        }

        if (newEvent?.id) {
          await sharePointService.updateBooking(bookingId, {
            CalendarEventId: newEvent.id,
          });
        }
      } catch (calendarError) {
        console.error('Failed to create new calendar event:', calendarError);
      }

      // 5. Send reschedule notification
      try {
        await notificationService.sendBookingRescheduledNotification(
          booking,
          newSlots,
          previousSlots,
          reason,
          userName
        );
        notificationSent = true;
      } catch (notifyError) {
        console.error('Failed to send reschedule notification:', notifyError);
      }

      // 6. Audit log
      try {
        await auditService.logUpdate('Booking', bookingId, booking.ClientName, {
          previousStatus: booking.Status,
          previousSlots,
        }, {
          action: 'Rescheduled',
          reason,
          requestedBy: userName,
          status: 'Rescheduling Required',
          newSlots: {
            slot1: newSlots.slot1.toISOString(),
            slot2: newSlots.slot2.toISOString(),
            slot3: newSlots.slot3.toISOString(),
          },
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      const updatedBooking = await sharePointService.getBookingById(bookingId);
      return {
        success: true,
        booking: updatedBooking || undefined,
        oldCalendarEventDeleted,
        notificationSent,
      };
    } catch (error) {
      console.error('Booking reschedule failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule booking',
        oldCalendarEventDeleted,
        notificationSent,
      };
    }
  }

  /**
   * Cancel a booking - allows AMs to cancel their own bookings
   * Deletes calendar event and notifies relevant parties
   */
  async cancelBooking(
    bookingId: number,
    reason: string,
    cancellerEmail: string,
    cancellerName: string
  ): Promise<CancellationResult> {
    let calendarEventDeleted = false;
    let notificationSent = false;

    try {
      // 1. Get current booking
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          calendarEventDeleted,
          notificationSent,
        };
      }

      // 2. Verify the user owns this booking (or is a manager)
      if (booking.AccountManagerEmail.toLowerCase() !== cancellerEmail.toLowerCase()) {
        return {
          success: false,
          error: 'You can only cancel your own bookings',
          calendarEventDeleted,
          notificationSent,
        };
      }

      // 3. Check if booking can be cancelled
      if (booking.Status === 'Cancelled') {
        return {
          success: false,
          error: 'Booking is already cancelled',
          calendarEventDeleted,
          notificationSent,
        };
      }

      // 4. Delete calendar event if exists
      if (booking.CalendarEventId) {
        try {
          await graphService.deleteCalendarEvent(booking.CalendarEventId);
          calendarEventDeleted = true;
        } catch {
          try {
            await graphService.deleteMyCalendarEvent(booking.CalendarEventId);
            calendarEventDeleted = true;
          } catch (deleteError) {
            console.error('Failed to delete calendar event:', deleteError);
          }
        }
      }

      // 5. Update booking in SharePoint
      // Note: We keep the AssignedSpecialist fields for historical record,
      // but the specialist is now freed up for other bookings
      const previousStatus = booking.Status;
      await sharePointService.updateBooking(bookingId, {
        Status: 'Cancelled',
        Outcome: `Cancelled by ${cancellerName}: ${reason}`,
        CalendarEventId: undefined, // Clear calendar event ID
      });

      // 6. Send cancellation notification
      try {
        await notificationService.sendBookingCancelledNotification(booking, reason, cancellerName);
        notificationSent = true;
      } catch (notifyError) {
        console.error('Failed to send cancellation notification:', notifyError);
      }

      // 7. Audit log
      try {
        await auditService.logUpdate('Booking', bookingId, booking.ClientName, {
          previousStatus,
        }, {
          action: 'Cancelled',
          reason,
          cancelledBy: cancellerName,
          status: 'Cancelled',
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      const updatedBooking = await sharePointService.getBookingById(bookingId);
      return {
        success: true,
        booking: updatedBooking || undefined,
        calendarEventDeleted,
        notificationSent,
      };
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel booking',
        calendarEventDeleted,
        notificationSent,
      };
    }
  }

  /**
   * Delete a booking permanently - only for managers/admins
   * Deletes calendar event, sends notifications to AM and assigned specialist, removes from SharePoint
   */
  async deleteBooking(
    bookingId: number,
    reason: string,
    deleterEmail: string,
    deleterName: string
  ): Promise<DeletionResult> {
    let calendarEventDeleted = false;
    let notificationSent = false;

    try {
      // 1. Get current booking before deletion
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          calendarEventDeleted,
          notificationSent,
        };
      }

      // 2. Delete calendar event if exists
      if (booking.CalendarEventId) {
        try {
          await graphService.deleteCalendarEvent(booking.CalendarEventId);
          calendarEventDeleted = true;
        } catch {
          try {
            await graphService.deleteMyCalendarEvent(booking.CalendarEventId);
            calendarEventDeleted = true;
          } catch (deleteError) {
            console.error('Failed to delete calendar event:', deleteError);
          }
        }
      }

      // 3. Send deletion notification to AM and assigned specialist
      try {
        await notificationService.sendBookingDeletedNotification(booking, reason, deleterName);
        notificationSent = true;
      } catch (notifyError) {
        console.error('Failed to send deletion notification:', notifyError);
      }

      // 4. Soft-delete: set status to 'Deleted' and store previous status in Outcome
      await sharePointService.updateBooking(bookingId, {
        Status: 'Deleted',
        Outcome: `Deleted by ${deleterName}. Reason: ${reason}. Previous status: ${booking.Status}`,
      });

      // 5. Audit log
      try {
        await auditService.logDelete('Booking', bookingId, booking.ClientName, {
          action: 'Deleted',
          reason,
          deletedBy: deleterName,
          deletedByEmail: deleterEmail,
          previousStatus: booking.Status,
          clientName: booking.ClientName,
          bookingType: booking.BookingType,
          accountManagerEmail: booking.AccountManagerEmail,
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      return {
        success: true,
        calendarEventDeleted,
        notificationSent,
      };
    } catch (error) {
      console.error('Booking deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete booking',
        calendarEventDeleted,
        notificationSent,
      };
    }
  }

  /**
   * Restore a soft-deleted booking to its previous status
   */
  async restoreBooking(
    bookingId: number,
    restorerName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.Status !== 'Deleted') {
        return { success: false, error: 'Booking is not in deleted state' };
      }

      // Extract previous status from Outcome field
      const previousStatusMatch = booking.Outcome?.match(/Previous status: (.+)/);
      const previousStatus = (previousStatusMatch?.[1] as BookingStatus) || 'Pending Review';

      await sharePointService.updateBooking(bookingId, {
        Status: previousStatus,
        Outcome: `Restored by ${restorerName}`,
      });

      try {
        await auditService.logUpdate('Booking', bookingId, booking.ClientName, {
          previousStatus: 'Deleted',
        }, {
          action: 'Restored',
          restoredBy: restorerName,
          status: previousStatus,
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      return { success: true };
    } catch (error) {
      console.error('Booking restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to restore booking',
      };
    }
  }

  /**
   * Permanently delete a soft-deleted booking from SharePoint
   */
  async permanentlyDeleteBooking(
    bookingId: number,
    deleterName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const booking = await sharePointService.getBookingById(bookingId);
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      await sharePointService.deleteBooking(bookingId);

      try {
        await auditService.logDelete('Booking', bookingId, booking.ClientName, {
          action: 'PermanentlyDeleted',
          deletedBy: deleterName,
          previousStatus: booking.Status,
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      return { success: true };
    } catch (error) {
      console.error('Permanent deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to permanently delete booking',
      };
    }
  }

  /**
   * Check if a similar booking already exists
   */
  async checkForDuplicateBooking(
    clientName: string,
    proposedSlot: string,
    _accountManagerEmail: string
  ): Promise<{ isDuplicate: boolean; existingBooking?: Booking }> {
    try {
      // Check for bookings within 24 hours of the proposed slot
      const slotDate = new Date(proposedSlot);
      const checkStart = new Date(slotDate.getTime() - 24 * 60 * 60 * 1000);
      const checkEnd = new Date(slotDate.getTime() + 24 * 60 * 60 * 1000);

      const existingBookings = await sharePointService.getBookings({});

      const duplicate = existingBookings.find((booking) => {
        // Check if same client
        if (booking.ClientName.toLowerCase() !== clientName.toLowerCase()) {
          return false;
        }

        // Check if not cancelled
        if (booking.Status === 'Cancelled') {
          return false;
        }

        // Check if within time window
        const bookingDate = new Date(booking.ProposedSlot1);
        return bookingDate >= checkStart && bookingDate <= checkEnd;
      });

      return {
        isDuplicate: !!duplicate,
        existingBooking: duplicate,
      };
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Check multiple slots for calendar conflicts
   */
  async checkSlotsForConflicts(
    slots: Array<{ slot: string; label: string }>
  ): Promise<ConflictCheckResult[]> {
    const results: ConflictCheckResult[] = [];

    for (const { slot, label } of slots) {
      const startTime = new Date(slot);
      const endTime = addHours(startTime, 1); // Default 1 hour duration for conflict check

      const conflictCheck = await graphService.checkCalendarConflicts(startTime, endTime);

      results.push({
        hasConflict: conflictCheck.hasConflict,
        conflicts: conflictCheck.conflicts,
        slot: label,
      });
    }

    return results;
  }

  /**
   * Build HTML body for calendar event (new booking)
   */
  private buildCalendarEventBody(booking: Booking, proposedSlots: string[]): string {
    return `
      <h2>DWx Service ${booking.BookingType} Booking</h2>
      <p><strong>Client:</strong> ${booking.ClientName} ${booking.IsPremiumClient ? '⭐ (Premium)' : ''}</p>
      <p><strong>Type:</strong> ${booking.BookingType}</p>
      <p><strong>Licenses:</strong> ${booking.LicenseCount.toLocaleString()}</p>
      <p><strong>Account Manager:</strong> ${booking.AccountManagerName}</p>
      <p><strong>Status:</strong> ${booking.Status}</p>
      <hr/>
      <h3>Proposed Time Slots</h3>
      <ul>
        <li><strong>Option 1:</strong> ${format(new Date(proposedSlots[0]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
        <li><strong>Option 2:</strong> ${format(new Date(proposedSlots[1]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
        <li><strong>Option 3:</strong> ${format(new Date(proposedSlots[2]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
      </ul>
      ${booking.Comments ? `<p><strong>Comments:</strong> ${booking.Comments}</p>` : ''}
      <hr/>
      <p><em>This event was automatically created by DWx Traffic Manager</em></p>
    `;
  }

  /**
   * Build HTML body for confirmed calendar event
   */
  private buildConfirmedCalendarEventBody(
    booking: Booking,
    confirmedSlot: string,
    approverName: string
  ): string {
    // Calculate checklist due date for Deployment bookings (3 days before)
    const deploymentChecklistSection = booking.BookingType === 'Deployment' ? `
      <hr/>
      <h3 style="color: #f7630c;">📋 Deployment Readiness Checklist</h3>
      <p style="background: #fff4ce; padding: 10px; border-radius: 4px;"><strong>Due Date:</strong> ${format(new Date(new Date(confirmedSlot).getTime() - 3 * 24 * 60 * 60 * 1000), "EEEE, MMMM d, yyyy")} (3 days before deployment)</p>
      <p>Please complete the following items before the deployment:</p>
      <ul style="list-style-type: none; padding-left: 0;">
        <li style="padding: 6px 0;">☐ <strong>Bill of Materials Available</strong> - The BOM document has been prepared</li>
        <li style="padding: 6px 0;">☐ <strong>Licenses Provisioned</strong> - All required licenses have been provisioned</li>
        <li style="padding: 6px 0;">☐ <strong>Service Account Provisioned</strong> - Service account created with appropriate permissions</li>
        <li style="padding: 6px 0;">☐ <strong>Environment Created</strong> - Deployment environment has been set up</li>
        <li style="padding: 6px 0;">☐ <strong>Power BI Workspace Created</strong> - Power BI workspace created and access granted</li>
      </ul>
    ` : '';

    return `
      <h2>✅ CONFIRMED: DWx Service ${booking.BookingType}</h2>
      <p><strong>Client:</strong> ${booking.ClientName} ${booking.IsPremiumClient ? '⭐ (Premium)' : ''}</p>
      <p><strong>Type:</strong> ${booking.BookingType}</p>
      <p><strong>Licenses:</strong> ${booking.LicenseCount.toLocaleString()}</p>
      <p><strong>Account Manager:</strong> ${booking.AccountManagerName}</p>
      <hr/>
      <h3>Confirmed Time</h3>
      <p style="font-size: 16px; color: #107c10;"><strong>${format(new Date(confirmedSlot), "EEEE, MMMM d, yyyy 'at' h:mm a")}</strong></p>
      <p><em>Approved by: ${approverName}</em></p>
      ${booking.Comments ? `<p><strong>Comments:</strong> ${booking.Comments}</p>` : ''}
      ${deploymentChecklistSection}
      <hr/>
      <p><em>This event was automatically updated by DWx Traffic Manager</em></p>
    `;
  }

  /**
   * Build HTML body for reschedule calendar event
   */
  private buildRescheduleCalendarEventBody(
    booking: Booking,
    newSlots: string[],
    reason: string
  ): string {
    return `
      <h2>🔄 RESCHEDULING: DWx Service ${booking.BookingType}</h2>
      <p><strong>Client:</strong> ${booking.ClientName} ${booking.IsPremiumClient ? '⭐ (Premium)' : ''}</p>
      <p><strong>Type:</strong> ${booking.BookingType}</p>
      <p><strong>Licenses:</strong> ${booking.LicenseCount.toLocaleString()}</p>
      <p><strong>Account Manager:</strong> ${booking.AccountManagerName}</p>
      ${reason ? `<p><strong>Reschedule Reason:</strong> ${reason}</p>` : ''}
      <hr/>
      <h3>New Proposed Time Slots</h3>
      <ul>
        <li><strong>Option 1:</strong> ${format(new Date(newSlots[0]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
        <li><strong>Option 2:</strong> ${format(new Date(newSlots[1]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
        <li><strong>Option 3:</strong> ${format(new Date(newSlots[2]), "EEEE, MMMM d, yyyy 'at' h:mm a")}</li>
      </ul>
      <p><em>Awaiting approval for new time slot</em></p>
      <hr/>
      <p><em>This event was automatically created by DWx Traffic Manager</em></p>
    `;
  }
}

export const bookingService = new BookingService();
