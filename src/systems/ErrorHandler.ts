import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/gameConfig';

interface ErrorLog {
    timestamp: number;
    message: string;
    stack?: string;
    context?: string;
}

class ErrorHandlerClass {
    private logs: ErrorLog[] = [];
    private scene: Phaser.Scene | null = null;
    private errorOverlay: Phaser.GameObjects.Container | null = null;
    private maxLogs = 50;

    initialize(scene: Phaser.Scene): void {
        this.scene = scene;

        /* Global error handlers */
        window.addEventListener('error', (event) => {
            this.captureError(event.error || event.message, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(event.reason, 'Unhandled Promise Rejection');
        });
    }

    captureError(error: Error | string, context?: string): void {
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;

        const log: ErrorLog = {
            timestamp: Date.now(),
            message,
            stack,
            context
        };

        this.logs.push(log);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.error(`[ErrorHandler] ${context || 'Error'}:`, message);
        if (stack) console.error(stack);

        /* Store in localStorage for persistence */
        try {
            localStorage.setItem('teatro_error_logs', JSON.stringify(this.logs.slice(-10)));
        } catch (_e) {
            /* Ignore storage errors */
        }
    }

    showErrorScreen(message: string, recoverable = true): void {
        if (!this.scene) return;

        if (this.errorOverlay) {
            this.errorOverlay.destroy();
        }

        this.errorOverlay = this.scene.add.container(0, 0);
        this.errorOverlay.setDepth(9999);
        this.errorOverlay.setScrollFactor(0);

        const bg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a0000, 0.95);

        const title = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'ERRORE', {
            fontFamily: 'Georgia, serif',
            fontSize: '36px',
            color: '#ff4444'
        }).setOrigin(0.5);

        const text = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, message, {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: GAME_WIDTH - 100 }
        }).setOrigin(0.5);

        this.errorOverlay.add([bg, title, text]);

        if (recoverable) {
            const retryBtn = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '[PREMI SPAZIO PER RIPROVARE]', {
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#888888'
            }).setOrigin(0.5);

            this.errorOverlay.add(retryBtn);

            this.scene.input.keyboard?.once('keydown-SPACE', () => {
                this.hideErrorScreen();
            });
        }
    }

    hideErrorScreen(): void {
        if (this.errorOverlay) {
            this.errorOverlay.destroy();
            this.errorOverlay = null;
        }
    }

    getLogs(): ErrorLog[] {
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
        try {
            localStorage.removeItem('teatro_error_logs');
        } catch (_e) { /* Ignore */ }
    }

    /**
     * Wraps an async function with error handling
     */
    async safeAsync<T>(fn: () => Promise<T>, context?: string): Promise<T | null> {
        try {
            return await fn();
        } catch (error) {
            this.captureError(error as Error, context);
            return null;
        }
    }

    /**
     * Wraps a sync function with error handling
     */
    safe<T>(fn: () => T, context?: string, fallback?: T): T | undefined {
        try {
            return fn();
        } catch (error) {
            this.captureError(error as Error, context);
            return fallback;
        }
    }
}

export const ErrorHandler = new ErrorHandlerClass();
