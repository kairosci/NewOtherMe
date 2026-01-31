import Phaser from "phaser";

/**
 * Reusable Slider component for menus.
 */
export class Slider extends Phaser.GameObjects.Container {
    private label: Phaser.GameObjects.Text;
    private track: Phaser.GameObjects.Rectangle;
    private fill: Phaser.GameObjects.Rectangle;
    private handle: Phaser.GameObjects.Arc;
    private value: number = 0.5;
    private onChange: (value: number) => void;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        text: string,
        initialValue: number,
        width: number = 200,
        onChange: (val: number) => void,
    ) {
        super(scene, x, y);
        this.value = initialValue;
        this.onChange = onChange;

        /* Label */
        this.label = scene.add
            .text(0, -30, text, {
                fontFamily: "monospace",
                fontSize: "18px",
                color: "#aaaaaa",
            })
            .setOrigin(0.5);

        /* Track */
        this.track = scene.add.rectangle(0, 0, width, 10, 0x333333).setOrigin(0.5);
        this.track.setInteractive({ useHandCursor: true });

        /* Fill */
        const fillWidth = width * this.value;
        this.fill = scene.add.rectangle(-width / 2, 0, fillWidth, 10, 0xd4af37).setOrigin(0, 0.5);

        /* Handle */
        this.handle = scene.add.arc(-width / 2 + fillWidth, 0, 8, 0, 360, false, 0xffffff);
        this.handle.setStrokeStyle(2, 0x000000);
        this.handle.setInteractive({ useHandCursor: true, draggable: true });

        this.add([this.label, this.track, this.fill, this.handle]);
        scene.add.existing(this);

        /* Input Events */
        this.handle.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number) => {
            const minX = -width / 2;
            const maxX = width / 2;
            const clampedX = Phaser.Math.Clamp(dragX, minX, maxX);

            this.handle.x = clampedX;
            this.value = (clampedX - minX) / width;
            this.updateVisuals(width);
            this.onChange(this.value);
        });

        this.track.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            const localX = pointer.x - (this.x + scene.cameras.main.scrollX);
            const minX = -width / 2;
            const maxX = width / 2;
            const clampedX = Phaser.Math.Clamp(localX, minX, maxX);

            this.handle.x = clampedX;
            this.value = (clampedX - minX) / width;
            this.updateVisuals(width);
            this.onChange(this.value);
        });
    }

    private updateVisuals(width: number): void {
        this.fill.width = width * this.value;
    }

    public getValue(): number {
        return this.value;
    }
}
