import Phaser from 'phaser';

export class AudioManager {
    private static _instance: AudioManager;
    private scene: Phaser.Scene;

    // Placeholder for actual sound objects
    // private bgmCalm: Phaser.Sound.BaseSound;
    // private bgmAnger: Phaser.Sound.BaseSound;

    private constructor() { }

    static getInstance(): AudioManager {
        if (!AudioManager._instance) {
            AudioManager._instance = new AudioManager();
        }
        return AudioManager._instance;
    }

    init(scene: Phaser.Scene): void {
        this.scene = scene;
        // Load sounds here if available
        // this.bgmCalm = ...
    }

    playBGM(type: 'calm' | 'anger' | 'neutral'): void {
        // Mock implementation
        console.log(`[Audio] Playing BGM: ${type}`);
        // Logic to fade out current and fade in new would go here
    }

    playSFX(key: string): void {
        console.log(`[Audio] Playing SFX: ${key}`);
        // this.scene.sound.play(key);
    }

    updateDynamicAudio(maskScore: number): void {
        // < -1 : Calm
        // > 1 : Anger
        // else : Neutral
        if (maskScore < -1) this.playBGM('calm');
        else if (maskScore > 1) this.playBGM('anger');
        else this.playBGM('neutral');
    }
}
