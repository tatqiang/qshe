import { supabase } from '../lib/api/supabase';

/**
 * Utility functions for managing pre-registration records
 */

/**
 * Clean up completed pre-registration records
 * WARNING: This permanently deletes audit trail data
 * 
 * @param daysOld - Only delete records older than this many days (default: 30)
 * @param dryRun - If true, only count records that would be deleted without actually deleting
 * @returns Object with count of deleted records and any errors
 */
export async function cleanupCompletedPreRegistrations(daysOld: number = 30, dryRun: boolean = true) {
  try {
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffIso = cutoffDate.toISOString();

    console.log(`${dryRun ? 'DRY RUN: ' : ''}Cleaning up pre-registration records older than ${daysOld} days (before ${cutoffIso})`);

    // Find records to clean up
    const { data: recordsToCleanup, error: selectError } = await (supabase as any)
      .from('pre_registrations')
      .select('id, email, status, registered_at, created_at')
      .eq('status', 'registered')
      .lt('registered_at', cutoffIso);

    if (selectError) {
      console.error('Error selecting records for cleanup:', selectError);
      return { success: false, error: selectError.message, deletedCount: 0 };
    }

    if (!recordsToCleanup || recordsToCleanup.length === 0) {
      console.log('No completed pre-registration records found for cleanup');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${recordsToCleanup.length} completed pre-registration records for cleanup:`, 
      recordsToCleanup.map((r: any) => ({ 
        email: r.email, 
        registered_at: r.registered_at,
        created_at: r.created_at 
      }))
    );

    if (dryRun) {
      console.log('DRY RUN: Would delete', recordsToCleanup.length, 'records');
      return { success: true, deletedCount: recordsToCleanup.length, dryRun: true };
    }

    // Actually delete the records
    const { data: deletedRecords, error: deleteError } = await (supabase as any)
      .from('pre_registrations')
      .delete()
      .eq('status', 'registered')
      .lt('registered_at', cutoffIso)
      .select();

    if (deleteError) {
      console.error('Error deleting records:', deleteError);
      return { success: false, error: deleteError.message, deletedCount: 0 };
    }

    console.log(`Successfully deleted ${deletedRecords?.length || 0} completed pre-registration records`);
    return { success: true, deletedCount: deletedRecords?.length || 0 };

  } catch (error: any) {
    console.error('Unexpected error during cleanup:', error);
    return { success: false, error: error.message, deletedCount: 0 };
  }
}

/**
 * Get statistics about pre-registration records
 */
export async function getPreRegistrationStats() {
  try {
    // Get counts by status
    const { data: stats, error } = await (supabase as any)
      .from('pre_registrations')
      .select('status, created_at, registered_at');

    if (error) {
      console.error('Error fetching pre-registration stats:', error);
      return { success: false, error: error.message };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const summary = {
      total: stats?.length || 0,
      pending: stats?.filter((s: any) => s.status === 'pending')?.length || 0,
      registered: stats?.filter((s: any) => s.status === 'registered')?.length || 0,
      expired: stats?.filter((s: any) => s.status === 'expired')?.length || 0,
      registeredOlderThan30Days: stats?.filter((s: any) => 
        s.status === 'registered' && 
        s.registered_at && 
        new Date(s.registered_at) < thirtyDaysAgo
      )?.length || 0,
    };

    console.log('Pre-registration statistics:', summary);
    return { success: true, stats: summary };

  } catch (error: any) {
    console.error('Unexpected error fetching stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Manual cleanup function that can be called from console or admin interface
 * Usage examples:
 * 
 * // Dry run to see what would be deleted
 * await cleanupCompletedPreRegistrations(30, true);
 * 
 * // Actually delete records older than 90 days
 * await cleanupCompletedPreRegistrations(90, false);
 * 
 * // Get current statistics
 * await getPreRegistrationStats();
 */
