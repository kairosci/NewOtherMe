import Phaser from "phaser";
import { VISUALS } from "@/config/visualConfig";

/**
 * Effects Manager
 * Handles screen-wide visual feedback, dynamic lighting, weather, and particles.
 */
export class EffectsManager {
    private scene: Phaser.Scene;

    /* Lighting */
    private ambientLayer!: Phaser.GameObjects.Rectangle;
    private lightsLayer!: Phaser.GameObjects.Container;
    private vignette!: Phaser.GameObjects.Graphics;

    /* Weather */
    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private rainEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createSystems();
    }

    private createSystems(): void {
        /* 1. Lighting System */
        this.ambientLayer = this.scene.add.rectangle(
            0,
            0,
            this.scene.scale.width,
            this.scene.scale.height,
            VISUALS.COLORS.AMBIENT.DEFAULT,
            0,
        );
        this.ambientLayer.setOrigin(0);
        this.ambientLayer.setScrollFactor(0);
        this.ambientLayer.setDepth(900);
        this.ambientLayer.setBlendMode(Phaser.BlendModes.MULTIPLY);

        this.lightsLayer = this.scene.add.container(0, 0);
        this.lightsLayer.setDepth(901);
        this.lightsLayer.setBlendMode(Phaser.BlendModes.ADD);

        this.vignette = this.scene.add.graphics();
        this.vignette.setScrollFactor(0);
        this.vignette.setDepth(1100);
        this.vignette.fillStyle(0x000000, 1);
        this.vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1, 1, 0, 0);
        this.vignette.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        this.vignette.setAlpha(0.6);
        this.vignette.setVisible(false);

        /* 2. Particle System */
        const texture = this.scene.textures.exists("star") ? "star" : "particle";
        if (!this.scene.textures.exists(texture)) {
            const canvas = this.scene.textures.createCanvas("particle", 4, 4);
            const source = canvas.getSourceImage();
            if (source instanceof HTMLCanvasElement) {
                const ctx = source.getContext("2d");
                if (ctx) {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, 4, 4);
                }
            }
            canvas.refresh();
        }

        /* Emitters */
        this.dustEmitter = this.scene.add.particles(0, 0, texture, {
            alpha: { start: 0.3, end: 0 },
            scale: { start: 0.5, end: 1 },
            tint: VISUALS.COLORS.PARTICLES.GOLD,
            lifespan: 3000,
            speed: { min: 10, max: 30 },
            angle: { min: 0, max: 360 },
            frequency: -1,
            blendMode: "ADD",
            emitting: false,
        });
        this.dustEmitter.setDepth(899);

        this.rainEmitter = this.scene.add.particles(0, 0, texture, {
            alpha: { start: 0.5, end: 0.2 },
            scaleX: 0.1,
            scaleY: 2,
            tint: VISUALS.COLORS.PARTICLES.RAIN,
            lifespan: 600,
            speedY: { min: 300, max: 500 },
            speedX: { min: -10, max: 10 },
            frequency: -1,
            blendMode: "NORMAL",
            emitting: false,
        });
        this.rainEmitter.setDepth(899);
    }

    public setAtmosphere(mapId: string): void {
        this.dustEmitter.stop();
        this.rainEmitter.stop();
        this.lightsLayer.removeAll(true);
        this.vignette.setVisible(false);
        this.ambientLayer.setFillStyle(VISUALS.COLORS.AMBIENT.DEFAULT, 0);

        switch (mapId) {
            case "theater":
                this.ambientLayer.setFillStyle(
                    VISUALS.COLORS.AMBIENT.THEATER,
                    VISUALS.ATMOSPHERE.THEATER.alpha,
                );
                this.vignette.setVisible(true);
                this.vignette.setAlpha(VISUALS.ATMOSPHERE.THEATER.vignette);

                this.dustEmitter.setPosition(
                    this.scene.scale.width / 2,
                    this.scene.scale.height / 2,
                );
                this.dustEmitter.setEmitZone({
                    source: new Phaser.Geom.Rectangle(
                        0,
                        0,
                        this.scene.scale.width,
                        this.scene.scale.height,
                    ),
                    type: "random",
                });
                this.dustEmitter.setFrequency(VISUALS.ATMOSPHERE.THEATER.dustFreq);
                this.dustEmitter.start();
                break;

            case "naplesAlley":
                this.ambientLayer.setFillStyle(
                    VISUALS.COLORS.AMBIENT.NAPLES_ALLEY,
                    VISUALS.ATMOSPHERE.NAPLES_ALLEY.alpha,
                );
                this.vignette.setVisible(true);
                this.vignette.setAlpha(VISUALS.ATMOSPHERE.NAPLES_ALLEY.vignette);

                this.rainEmitter.setPosition(this.scene.scale.width / 2, -10);
                this.rainEmitter.setEmitZone(
                    new Phaser.GameObjects.Particles.Zones.RandomZone(
                        new Phaser.Geom.Rectangle(0, 0, this.scene.scale.width, 1),
                    ),
                );
                this.rainEmitter.setFrequency(VISUALS.ATMOSPHERE.NAPLES_ALLEY.rainFreq);
                this.rainEmitter.start();
                break;

            case "fatherHouse":
                this.ambientLayer.setFillStyle(
                    VISUALS.COLORS.AMBIENT.FATHER_HOUSE,
                    VISUALS.ATMOSPHERE.FATHER_HOUSE.alpha,
                );
                this.vignette.setVisible(true);
                this.vignette.setAlpha(VISUALS.ATMOSPHERE.FATHER_HOUSE.vignette);
                break;
            default:
                this.ambientLayer.setFillStyle(
                    VISUALS.COLORS.AMBIENT.APARTMENT,
                    VISUALS.ATMOSPHERE.DEFAULT.alpha,
                );
                break;
        }
    }

    public update(time: number, delta: number, player: Phaser.Physics.Arcade.Sprite): void {
        const { VELOCITY_THRESHOLD, INTERVAL } = VISUALS.SHADOW_TRAIL;
        if (player.body.velocity.length() > VELOCITY_THRESHOLD) {
            if (time % INTERVAL < delta) {
                this.createShadowEcho(player);
            }
        }
    }

    private createShadowEcho(target: Phaser.Physics.Arcade.Sprite): void {
        const { DURATION, ALPHA, SCALE } = VISUALS.SHADOW_TRAIL;
        const echo = this.scene.add.sprite(
            target.x,
            target.y,
            target.texture.key,
            target.frame.name,
        );
        echo.setTint(0x000000);
        echo.setAlpha(ALPHA);
        echo.setDepth(target.depth - 1);

        this.scene.tweens.add({
            targets: echo,
            alpha: 0,
            scale: SCALE,
            duration: DURATION,
            onComplete: () => echo.destroy(),
        });
    }

    /**
     * Creates a screen flash effect.
     * @param color Flash color (default white)
     * @param duration Flash duration
     */
    public flash(color: number = 0xffffff, duration: number = 200): void {
        this.scene.cameras.main.flash(
            duration,
            (color >> 16) & 0xff,
            (color >> 8) & 0xff,
            color & 0xff,
        );
    }
}
