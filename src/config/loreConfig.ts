import type { LoreItem, Monologue } from "@/types/lore";

export const LORE_ITEMS: Record<string, LoreItem> = {
    // --- APARTMENT ---
    apt_mirror: {
        id: "apt_mirror",
        map: "apartment",
        x: 12,
        y: 8,
        description: [
            "Uno specchio crepato.",
            "Il mio riflesso sembra sempre stanco.",
            "Purtroppo non è colpa del vetro... sono proprio così.",
        ],
    },
    apt_coffee_pot: {
        id: "apt_coffee_pot",
        map: "apartment",
        x: 8,
        y: 12,
        description: [
            "La moka è fredda. Come la mia vita.",
            "Un tempo l'odore del caffè significava 'buongiorno'.",
            "Ora è solo carburante per non crollare.",
        ],
        isMemory: true,
        memoryTitle: "Il Profumo di Casa",
    },
    apt_photo: {
        id: "apt_photo",
        map: "apartment",
        x: 15,
        y: 10,
        description: [
            "Una vecchia polaroid di me e mia madre.",
            "Sorrideva sempre, nonostante tutto.",
            "Io... io non ricordo l'ultima volta che l'ho fatto davvero.",
        ],
        isMemory: true,
        memoryTitle: "La Polaroid Sbiadita",
    },

    // --- THEATER ---
    theater_poster: {
        id: "theater_poster",
        map: "theater",
        x: 22,
        y: 15,
        description: [
            "Una locandina del San Carlo del 1998.",
            "Il mio nome non c'era allora, e non c'è oggi.",
            "Vent'anni a fare l'ombra. Vent'anni a essere invisibile.",
        ],
    },
    theater_mask_box: {
        id: "theater_mask_box",
        map: "theater",
        x: 10,
        y: 5,
        description: [
            "Ceste piene di maschere di cartapesta.",
            "Togli una maschera, ne trovi un'altra sotto.",
            "È così che funziona Napoli? O è così che funziono io?",
        ],
        isMemory: true,
        memoryTitle: "Le Cento Facce",
    },

    // --- VICOLI ---
    alley_altar: {
        id: "alley_altar",
        map: "naplesAlley",
        x: 14,
        y: 20,
        description: [
            "Un altarino con fiori secchi e lumini spenti.",
            "Preghiere sussurrate nel buio che nessuno ascolta.",
            "O forse siamo noi che non sappiamo più sentire.",
        ],
    },
};

export const MONOLOGUES: Record<string, Monologue> = {
    first_step: {
        id: "first_step",
        trigger: "map_enter",
        lines: [
            "Un altro giorno. Un'altra recita.",
            "Gennaro Esposito, l'uomo invisibile, è tornato.",
        ],
        condition: { map: "apartment" },
    },
    theater_fear: {
        id: "theater_fear",
        trigger: "map_enter",
        lines: [
            "Il teatro mi soffoca.",
            "Tutti quegli occhi... anche se non mi guardano, li sento.",
        ],
        condition: { map: "theater" },
    },
};
