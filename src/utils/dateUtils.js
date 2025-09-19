/**
 * Utility functions for date formatting and manipulation
 */

export function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Invalid Date';

        return date.toLocaleString();
    } catch (error) {
        return 'Invalid Date';
    }
}

export function formatRelativeTime(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;

        return date.toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
}

export function isRecentTimestamp(timestamp, thresholdMs = 60000) {
    if (!timestamp) return false;

    try {
        const date = new Date(timestamp);
        const now = new Date();
        return (now - date) < thresholdMs;
    } catch (error) {
        return false;
    }
}
