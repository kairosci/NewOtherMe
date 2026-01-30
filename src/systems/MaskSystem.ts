import Phaser from 'phaser';

export class MaskSystem {
    private static _instance: MaskSystem;
    private scene: Phaser.Scene;
    private score: number = 0;
    private text: Phaser.GameObjects.Text;
    private bar: Phaser.GameObjects.Rectangle;
    private icon: Phaser.GameObjects.Image;
    private container: Phaser.GameObjects.Container;

    private constructor() { }

    static getInstance(): MaskSystem {
        if (!MaskSystem._instance) {
            MaskSystem._instance = new MaskSystem();
        }
        return MaskSystem._instance;
    }

    init(scene: Phaser.Scene): void {
        this.scene = scene;
        this.score = 0;
        this.createHUD();
    }

    private createHUD(): void {
        // Container fisso in alto
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);

        // Background HUD
        const bg = this.scene.add.rectangle(10, 10, 300, 50, 0x000000, 0.7);
        bg.setOrigin(0, 0);

        // Icona Maschera (placeholder o asset)
        this.icon = this.scene.add.image(35, 35, 'mask'); // Assumiamo asset 'mask'
        this.icon.setScale(0.5);

        // Barra Score
        // Score va da -3 a +3. Normalizziamo visualmente.
        // Centro (0) = Neutro. Destra (>0) = Maschera/Bad. Sinistra (<0) = Umano/Good.
        // Ma il prompt dice: maskScore <= 0 GOOD, > 0 BAD
        // Facciamo una barra che si riempie verso destra (rossa) per punteggi positivi (bad)

        const barBg = this.scene.add.rectangle(70, 35, 200, 15, 0x333333);
        barBg.setOrigin(0, 0.5);

        this.bar = this.scene.add.rectangle(170, 35, 0, 15, 0xffffff); // Parte dal centro
        this.bar.setOrigin(0.5, 0.5); // Centro

        this.text = this.scene.add.text(280, 35, '0%', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffffff'
        });
        this.text.setOrigin(0.5);

        this.container.add([bg, this.icon, barBg, this.bar, this.text]);
        this.updateHUD();
    }

    modifyScore(amount: number): void {
        this.score += amount;
        this.updateHUD();
    }

    getScore(): number {
        return this.score;
    }

    private updateHUD(): void {
        // Visualizzazione:
        // 0 = Centro.
        // +1, +2, +3 = Barra Rossa verso destra
        // -1, -2, -3 = Barra Verde verso sinistra

        const maxScore = 3;
        const widthPerPoint = 30; // 200px width total approx

        const barWidth = Math.min(Math.abs(this.score) * widthPerPoint, 100);

        this.bar.width = barWidth;

        if (this.score > 0) {
            this.bar.setFillStyle(0xff0000); // Rosso (Bad/Mask)
            this.bar.x = 170 + barWidth / 2; // Sposta a destra dal centro (170)
        } else if (this.score < 0) {
            this.bar.setFillStyle(0x00ff00); // Verde (Good/Human)
            this.bar.x = 170 - barWidth / 2; // Sposta a sinistra dal centro
        } else {
            this.bar.width = 2;
            this.bar.setFillStyle(0xffffff);
            this.bar.x = 170;
        }

        this.text.setText(`${this.score}`);

        // Effetto visuale in base allo score
        if (this.score >= 2) {
            this.scene.cameras.main.setTint(0xffcccc); // Tinta rossa leggera
        } else if (this.score <= -2) {
            this.scene.cameras.main.setTint(0xccffcc); // Tinta verde leggera
        } else {
            this.scene.cameras.main.clearTint();
        }
    }
}
