/**
 * Ensures a date is at least 2 years old (pre-Dec 2023).
 * If the date is newer, returns a random date between 2015 and 2022.
 */
export function ensureOldDate(dateStr: string): string {
    const date = new Date(dateStr);
    const cutoff = new Date('2023-12-31');

    if (date > cutoff) {
        const year = Math.floor(Math.random() * (2022 - 2015 + 1)) + 2015;
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        return new Date(year, month, day).toISOString();
    }

    return date.toISOString();
}

/**
 * Returns a random ISO date string between 2015 and 2022.
 */
export function getRandomOldDate(): string {
    const year = Math.floor(Math.random() * (2022 - 2015 + 1)) + 2015;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    return new Date(year, month, day).toISOString();
}
