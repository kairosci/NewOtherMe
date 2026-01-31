/**
 * Utility to detect if the game is running on a mobile device.
 * Used to enable touch controls and adjust UI layout.
 */

/**
 * Checks if the user agent string indicates a mobile device.
 */
export function isMobile(): boolean {
    const ua = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Checks if the device supports touch events.
 */
export function isTouchDevice(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Returns true if either mobile UA or touch support is detected.
 */
export function shouldEnableMobileControls(): boolean {
    return isMobile() || isTouchDevice();
}
