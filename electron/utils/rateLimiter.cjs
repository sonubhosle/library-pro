// Rate limiter for login attempts
class RateLimiter {
    constructor() {
        this.attempts = new Map(); // { email: { count, timestamp } }
        this.maxAttempts = 5;
        this.windowMs = 15 * 60 * 1000; // 15 minutes
        this.blockDurationMs = 30 * 60 * 1000; // 30 minutes
    }

    isBlocked(email) {
        const record = this.attempts.get(email);
        if (!record) return false;

        const now = Date.now();
        const timeSinceLastAttempt = now - record.timestamp;

        // If blocked, check if block period has expired
        if (record.blocked) {
            if (timeSinceLastAttempt > this.blockDurationMs) {
                this.attempts.delete(email);
                return false;
            }
            return true;
        }

        // If window has expired, reset
        if (timeSinceLastAttempt > this.windowMs) {
            this.attempts.delete(email);
            return false;
        }

        return false;
    }

    recordAttempt(email, success = false) {
        const now = Date.now();
        const record = this.attempts.get(email);

        if (!record) {
            this.attempts.set(email, {
                count: success ? 0 : 1,
                timestamp: now,
                blocked: false
            });
            return;
        }

        if (success) {
            // Clear on successful login
            this.attempts.delete(email);
            return;
        }

        // Failed attempt
        record.count += 1;
        record.timestamp = now;

        if (record.count >= this.maxAttempts) {
            record.blocked = true;
        }

        this.attempts.set(email, record);
    }

    getRemainingAttempts(email) {
        const record = this.attempts.get(email);
        if (!record) return this.maxAttempts;
        if (record.blocked) return 0;
        return Math.max(0, this.maxAttempts - record.count);
    }

    getBlockedUntil(email) {
        const record = this.attempts.get(email);
        if (!record || !record.blocked) return null;
        return new Date(record.timestamp + this.blockDurationMs);
    }

    // Cleanup old entries every 10 minutes
    cleanup() {
        const now = Date.now();
        for (const [email, record] of this.attempts.entries()) {
            if (now - record.timestamp > this.blockDurationMs + this.windowMs) {
                this.attempts.delete(email);
            }
        }
    }

    // Clear a specific email (used after successful login)
    clear(email) {
        this.attempts.delete(email);
    }
}

module.exports = RateLimiter;
