import type Phaser from "phaser";
import { SCALE, TILE_SIZE } from "@/config/gameConfig";
import type { MapKey } from "@/types/game";

export interface MapConfig {
    width: number;
    height: number;
    floorColor: number;
    wallColor: number;
    objects: MapObject[];
    doors: DoorConfig[];
    npcs: string[];
}

export interface MapObject {
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
    label?: string;
    collision?: boolean;
}

export interface DoorConfig {
    x: number;
    y: number;
    targetMap: MapKey;
    targetX: number;
    targetY: number;
    label?: string;
}

export const MAP_CONFIGS: Record<MapKey, MapConfig> = {
    apartment: {
        width: 20,
        height: 15,
        floorColor: 0x4a3728,
        wallColor: 0x2a2a2a,
        objects: [
            { x: 3, y: 2, width: 5, height: 4, color: 0x654321, label: "Letto", collision: true },
            { x: 15, y: 2, width: 4, height: 3, color: 0x333333, label: "TV", collision: true },
            { x: 8, y: 6, width: 4, height: 3, color: 0x5a4a3a, label: "Tavolo", collision: true },
            { x: 2, y: 10, width: 3, height: 3, color: 0x4a4a5a, label: "Frigo", collision: true },
        ],
        doors: [{ x: 18, y: 7, targetMap: "theater", targetX: 2, targetY: 15, label: "Teatro" }],
        npcs: [],
    },
    theater: {
        width: 40,
        height: 30,
        floorColor: 0x3c1642,
        wallColor: 0x1a0a1a,
        objects: [
            {
                x: 15,
                y: 2,
                width: 10,
                height: 6,
                color: 0x4a2652,
                label: "PALCO",
                collision: false,
            },
            { x: 5, y: 20, width: 3, height: 3, color: 0x654321, collision: true },
            { x: 12, y: 20, width: 3, height: 3, color: 0x654321, collision: true },
            { x: 19, y: 20, width: 3, height: 3, color: 0x654321, collision: true },
            { x: 26, y: 20, width: 3, height: 3, color: 0x654321, collision: true },
            { x: 33, y: 20, width: 3, height: 3, color: 0x654321, collision: true },
            {
                x: 18,
                y: 10,
                width: 4,
                height: 2,
                color: 0xd4af37,
                label: "Maschera",
                collision: false,
            },
        ],
        doors: [
            { x: 1, y: 15, targetMap: "apartment", targetX: 16, targetY: 7, label: "Casa" },
            { x: 38, y: 15, targetMap: "naplesAlley", targetX: 2, targetY: 20, label: "Vicoli" },
        ],
        npcs: ["dario"],
    },
    naplesAlley: {
        width: 30,
        height: 40,
        floorColor: 0x5a5a5a,
        wallColor: 0x3a3a3a,
        objects: [
            {
                x: 5,
                y: 5,
                width: 8,
                height: 6,
                color: 0x4a4a4a,
                label: "Edificio",
                collision: true,
            },
            { x: 20, y: 5, width: 6, height: 8, color: 0x3a3a3a, label: "Muro", collision: true },
            {
                x: 3,
                y: 25,
                width: 4,
                height: 4,
                color: 0x2a4a2a,
                label: "Panchina",
                collision: true,
            },
            {
                x: 22,
                y: 30,
                width: 5,
                height: 4,
                color: 0x5a3a2a,
                label: "Negozio",
                collision: true,
            },
        ],
        doors: [
            { x: 1, y: 20, targetMap: "theater", targetX: 36, targetY: 15, label: "Teatro" },
            {
                x: 28,
                y: 38,
                targetMap: "fatherHouse",
                targetX: 12,
                targetY: 2,
                label: "Casa Padre",
            },
        ],
        npcs: ["elisa", "bully1", "bully2"],
    },
    fatherHouse: {
        width: 25,
        height: 20,
        floorColor: 0x3a3a4a,
        wallColor: 0x1a1a2a,
        objects: [
            { x: 5, y: 3, width: 6, height: 4, color: 0x4a3a3a, label: "Divano", collision: true },
            {
                x: 18,
                y: 3,
                width: 4,
                height: 3,
                color: 0x2a2a3a,
                label: "Libreria",
                collision: true,
            },
            {
                x: 10,
                y: 10,
                width: 5,
                height: 4,
                color: 0x3a3a3a,
                label: "Tavolo",
                collision: true,
            },
            { x: 3, y: 15, width: 3, height: 3, color: 0x5a4a3a, label: "Foto", collision: false },
        ],
        doors: [
            { x: 12, y: 1, targetMap: "naplesAlley", targetX: 26, targetY: 36, label: "Vicoli" },
        ],
        npcs: ["father_shadow"],
    },
};

/**
 * Manages map creation, including walls, objects, and doors.
 * Handles the visual representation based on configuration.
 */
export class MapManager {
    private scene: Phaser.Scene;
    private currentMap: MapKey;
    private walls: Phaser.Physics.Arcade.StaticGroup;
    private objects: Phaser.GameObjects.GameObject[] = [];

    constructor(scene: Phaser.Scene, mapKey: MapKey) {
        this.scene = scene;
        this.currentMap = mapKey;
        this.walls = scene.physics.add.staticGroup();
    }

    /**
     * Creates the map visuals and physics boundaries.
     * @returns Object containing the walls static group and map dimensions.
     */
    create(): { walls: Phaser.Physics.Arcade.StaticGroup; mapWidth: number; mapHeight: number } {
        const config = MAP_CONFIGS[this.currentMap];
        const mapWidth = config.width * TILE_SIZE * SCALE;
        const mapHeight = config.height * TILE_SIZE * SCALE;

        this.createFloor(mapWidth, mapHeight, config.floorColor);
        this.createWalls(mapWidth, mapHeight, config.wallColor);
        this.createObjects(config.objects);
        this.createDoors(config.doors);

        this.scene.physics.world.setBounds(0, 0, mapWidth, mapHeight);

        return { walls: this.walls, mapWidth, mapHeight };
    }

    private createFloor(width: number, height: number, color: number): void {
        const floor = this.scene.add.rectangle(width / 2, height / 2, width, height, color);
        floor.setDepth(-1);

        for (let x = 0; x < width; x += TILE_SIZE * SCALE) {
            for (let y = 0; y < height; y += TILE_SIZE * SCALE) {
                if (Math.random() > 0.9) {
                    const variation = this.scene.add.rectangle(
                        x + (TILE_SIZE * SCALE) / 2,
                        y + (TILE_SIZE * SCALE) / 2,
                        TILE_SIZE * SCALE - 2,
                        TILE_SIZE * SCALE - 2,
                        color - 0x101010,
                    );
                    variation.setDepth(-1);
                }
            }
        }
    }

    private createWalls(mapWidth: number, mapHeight: number, color: number): void {
        const thickness = TILE_SIZE * SCALE;

        const topWall = this.scene.add.rectangle(
            mapWidth / 2,
            thickness / 2,
            mapWidth,
            thickness,
            color,
        );
        const bottomWall = this.scene.add.rectangle(
            mapWidth / 2,
            mapHeight - thickness / 2,
            mapWidth,
            thickness,
            color,
        );
        const leftWall = this.scene.add.rectangle(
            thickness / 2,
            mapHeight / 2,
            thickness,
            mapHeight,
            color,
        );
        const rightWall = this.scene.add.rectangle(
            mapWidth - thickness / 2,
            mapHeight / 2,
            thickness,
            mapHeight,
            color,
        );

        [topWall, bottomWall, leftWall, rightWall].forEach((wall) => {
            this.walls.add(wall);
            wall.setDepth(0);
        });
    }

    private createObjects(objects: MapObject[]): void {
        const textureMap: Record<string, string> = {
            Letto: "furn_bed",
            TV: "furn_tv",
            Tavolo: "furn_table",
            Frigo: "furn_fridge",
            PALCO: "furn_stage",
            Maschera: "furn_mask",
            Edificio: "furn_building",
            Muro: "furn_wall",
            Panchina: "furn_bench",
            Negozio: "furn_shop",
            Divano: "furn_sofa",
            Libreria: "furn_bookshelf",
            Foto: "furn_photo",
        };

        objects.forEach((obj) => {
            const x = obj.x * TILE_SIZE * SCALE + (obj.width * TILE_SIZE * SCALE) / 2;
            const y = obj.y * TILE_SIZE * SCALE + (obj.height * TILE_SIZE * SCALE) / 2;
            const width = obj.width * TILE_SIZE * SCALE;
            const height = obj.height * TILE_SIZE * SCALE;
            let gameObject: Phaser.GameObjects.GameObject;

            if (obj.label && textureMap[obj.label]) {
                const sprite = this.scene.add.image(x, y, textureMap[obj.label]);
                /* Stage floor should be lower */
                sprite.setDepth(obj.label === "PALCO" ? 0 : 1);
                gameObject = sprite;
            } else {
                const rect = this.scene.add.rectangle(x, y, width, height, obj.color);
                rect.setDepth(1);
                gameObject = rect;
            }

            if (obj.collision) {
                this.walls.add(gameObject);
            }

            if (obj.label && !textureMap[obj.label]) {
                const label = this.scene.add.text(x, y, obj.label, {
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#ffffff",
                });
                label.setOrigin(0.5);
                label.setDepth(2);
            }

            this.objects.push(gameObject);
        });
    }

    private createDoors(doors: DoorConfig[]): void {
        doors.forEach((door) => {
            const x = door.x * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;
            const y = door.y * TILE_SIZE * SCALE + (TILE_SIZE * SCALE) / 2;

            const doorRect = this.scene.add.rectangle(
                x,
                y,
                TILE_SIZE * SCALE * 2,
                TILE_SIZE * SCALE * 3,
                0x8b4513,
            );
            doorRect.setDepth(1);
            doorRect.setStrokeStyle(2, 0x5a3a1a);

            if (door.label) {
                const label = this.scene.add.text(x, y - TILE_SIZE * SCALE * 2, door.label, {
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#ffffff",
                    backgroundColor: "#000000",
                    padding: { x: 4, y: 2 },
                });
                label.setOrigin(0.5);
                label.setDepth(100);
            }
        });
    }

    getDoors(): DoorConfig[] {
        return MAP_CONFIGS[this.currentMap].doors;
    }

    getNPCIds(): string[] {
        return MAP_CONFIGS[this.currentMap].npcs;
    }

    getConfig(): MapConfig {
        return MAP_CONFIGS[this.currentMap];
    }
}
