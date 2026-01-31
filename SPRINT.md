# IL TEATRO DELLE OMBRE - Roadmap di Sviluppo

## Stato Attuale del Progetto

### Sistemi Implementati

- [x] Sistema di movimento (WASD)
- [x] Sistema di dialogo con typewriter effect
- [x] Sistema di scelte con karma
- [x] Sistema di combattimento/minigame (6 tipi: QTE, Balance, Rhythm, Hold, Breath, Focus)
- [x] Sistema di salvataggio (LocalStorage)
- [x] Sistema maschere/tentazione
- [x] Transizioni tra mappe
- [x] Modalità Endless
- [x] UI del menu principale
- [x] Sistema NPC con interazioni
- [x] Sprite procedurali per personaggi
- [x] Refactoring commenti (JSDoc/Multi-line)
- [x] Rimozione emoji dalla documentazione e dal gioco

---

## FEATURES DA IMPLEMENTARE

### 1. SISTEMA AUDIO - **[PRIORITÀ ALTA]**

**Status:** [COMPLETATO]
**Tempo stimato:** 2-3 giorni
**Critico per l'atmosfera teatrale**

#### Cosa implementare

- [x] AudioManager class centrale
- [x] Musica di sottofondo per ogni scena (Loading Logic Active)
- Menu principale (orchestrale, misteriosa)
- Teatro (drammatica, crescendo)
- Vicolo (tesa, inquietante)
- Casa del padre (malinconica)
- [x] Effetti sonori:
- Passi (diversi per superficie: legno, pietra)
- Porte (cigolio, tonfo)
- UI (click, hover)
- [x] Ambiente:
- Pioggia (Vicolo)
- Brusio leggero (Teatro)

#### Note

Il refactoring è concluso. Il codice è pulito, gli asset organizzati e l'atmosfera implementata.
Progetto pronto per il rilascio Beta.

- Dialoghi (typewriter tick)
- [x] Selezione menu (click elegante)
- Minigame (feedback successo/fallimento)
- Transizioni tra mappe (whoosh)
- Passi del personaggio
- Apertura/chiusura porte

#### Files da creare

- `src/systems/AudioManager.ts`
- `public/audio/bgm/` (cartella musiche)
- `public/audio/sfx/` (cartella effetti)

#### Note

- Usare formati `.mp3` per compatibilità
- Implementare fade in/out per transizioni musicali
- Volume controllabile da settings

---

### 2. SISTEMA DI PAUSA - **[PRIORITÀ ALTA]**

**Status:** [COMPLETATO]
**Tempo stimato:** 1 giorno
**Standard per ogni gioco**

#### Cosa implementare

- [x] PauseScene con overlay trasparente
- [x] Tasto ESC per attivare/disattivare
- [x] Menu pausa con opzioni:
- Riprendi
- Impostazioni
- Torna al menu principale
- [x] Pausa automatica quando finestra perde focus
- [x] Salvataggio automatico quando si mette in pausa

#### Files da creare

- `src/scenes/PauseScene.ts`

---

### 3. IMPOSTAZIONI/OPZIONI

**Status:** [COMPLETATO]
**Tempo stimato:** 2 giorni
**Accessibilità importante**

#### Cosa implementare

- [x] SettingsScene completa
- [ ] Controlli:
- [x] Slider volume musica (0-100%)
- [x] Slider volume effetti (0-100%)
- [ ] Slider velocità testo dialoghi
- [ ] Toggle schermo intero
- [ ] Selector lingua (IT/EN)
- [x] Salvataggio preferenze persistente
- [ ] Preview in tempo reale delle modifiche

#### Files da creare

- `src/scenes/SettingsScene.ts`
- `src/ui/Slider.ts`
- `src/ui/Toggle.ts`

---

### 4. FEEDBACK VISIVO

**Status:** [COMPLETATO] (Phase 1)
**Tempo stimato:** 2-3 giorni
**Migliora la "game feel"**

#### UI Mancante

- [x] Barra della salute/energia (se implementi sistema vita)
- [x] **Indicatore Karma visuale** (medaglione che cambia colore)
- Bianco/dorato = karma positivo
- Grigio/nero = karma negativo
- [x] Animazione pulse quando cambia
- [x] Contatore stage/round migliorato
- [ ] Minimappa (opzionale)

#### Effetti da aggiungere

- [x] Shake camera quando prendi danno
- [x] Flash schermo per eventi importanti
- [x] Particelle quando vinci minigame
- [ ] Trail/ombra quando corri veloce
- [x] Glow sui personaggi interattivi
- [x] Indicatore "!" sopra NPC con nuovi dialoghi

#### Files da modificare/creare

- `src/systems/EffectsManager.ts`
- Sembra `GameScene.ts` con HUD

---

---

### 6. ANIMAZIONI PERSONAGGI

**Status:** [COMPLETATO]
**Tempo stimato:** 3-5 giorni
**Migliora l'aspetto visivo**

#### Opzioni

1. **Sprite animati semplici** (2-3 frame per direzione)
2. **Effetti particellari** per simulare movimento
3. **Bob animation** più sofisticata

#### Da implementare

- [x] Walk cycle (2 frame min per direzione)
- [x] Idle breathing animation
- [x] Animazioni emotive per NPC (jump, shake, etc.)

#### Files da modificare

- `src/scenes/BootScene.ts` (generazione sprite)
- `src/entities/Player.ts`
- `src/entities/NPC.ts`

---

### 7. MENU PRINCIPALE MIGLIORATO

**Status:** [COMPLETATO]
**Tempo stimato:** 1-2 giorni

#### Miglioramenti

- [x] Animazione titolo (fade in/pulse/lettere una alla volta)
- [x] Preview del salvataggio:
- [x] Data e ora
- [x] Tempo totale giocato
- [x] Karma attuale
- [x] Mappa corrente
- [ ] Opzioni menu aggiuntive:
- [ ] Crediti
- [ ] Come giocare
- [ ] Achievements/Trofei
- [ ] Galleria (unlock con progressione)
- [x] Transizione animata tra menu e gioco

#### Files da modificare

- `src/scenes/MenuScene.ts`

---

### 8. HUD IN-GAME

**Status:** [COMPLETATO]
**Tempo stimato:** 2 giorni

#### Elementi da aggiungere

```
─────────────────────────────────────────
 Vita: [########--] 80%
 Karma: [++++-] (Buono)
 Controllo Maschera: [======---] 60%
 Atto II - Teatro San Carlo
 Obiettivo: Trova l'uscita
─────────────────────────────────────────
```

- [x] Barra vita (se implementi sistema combattimento con HP)
- [x] Indicatore karma con icona
- [x] Barra controllo maschera (tentazione)
- [x] Testo mappa corrente
- [x] Obiettivo attuale
- [x] Mini-icone per stati (es: "Sotto effetto maschera")

#### Files da creare

- `src/ui/HUD.ts`

---

### 9. TRANSIZIONI TEATRALI

**Status:** [COMPLETATO]
**Tempo stimato:** 2 giorni
**Perfetto per il tema teatro!**

#### Transizioni da implementare

- [x] **Sipario** che si apre/chiude (rosso velluto)
- [ ] **Iris in/out** (stile film muto)
- [ ] **Page turn** per cambio atti
- [ ] **Fade attraverso nero** con testo narrativo
- [ ] Transizione maschera (distorsione quando tentazione alta)

#### Files da creare

- `src/effects/TransitionManager.ts`

---

---

### 11. ACHIEVEMENTS/TROFEI

**Status:** [COMPLETATO]
**Tempo stimato:** 2 giorni

#### Achievements suggeriti

- [ ] "Pacifista" - Completa il gioco senza scegliere opzioni aggressive
- [ ] "Dominatore" - Scegli sempre l'opzione maschera
- [ ] "Resistente" - Completa senza mai cedere alla tentazione
- [ ] "Esploratore" - Trova tutti i segreti
- [ ] "Velocista" - Completa in meno di 30 minuti
- [ ] "Collezionista" - Raccogli tutti gli oggetti
- [ ] "Tutti i finali" - Vedi tutti gli ending
- [ ] "Perfezionista" - Vinci tutti i minigame al primo tentativo

#### Files da creare

- `src/systems/AchievementManager.ts`
- `src/scenes/AchievementsScene.ts`

---

### 12. MINIGAME PIÙ RAFFINATI

**Status:** Funzionali ma basilari
**Tempo stimato:** 3-4 giorni

#### Miglioramenti per ogni minigame

- [ ] Difficoltà più bilanciata
- [ ] Feedback audio/visivo più chiaro
- [x] Combo system (bonus per sequenze perfette)
- [ ] Classifica personale (miglior tempo/punteggio)
- [x] Ricompense per performance perfetta

#### Nuovi minigame da aggiungere

- [x] Memory (carte da teatro)
- [x] Reaction (schiva attacchi)
- [x] Pattern matching (sequenza movimenti)

#### Files da modificare

- `src/systems/MinigameManager.ts`

---

### 13. DIALOGHI PIÙ RICCHI

**Status:** Funzionali ma minimal
**Tempo stimato:** 3-4 giorni

#### Miglioramenti

- [x] **Ritratti dei personaggi** (anche semplici, stile visual novel)
- [x] **Animazioni emotive** del ritratto:
- Shake per rabbia
- Bounce per gioia
- Fade per tristezza
- [x] **Scelte con timer** (10 secondi per decidere)
- [x] **Memoria delle scelte** (NPC ricordano cosa hai detto)
- [ ] **Branching più complesso** (albero decisionale profondo)
- [x] **Voice blips** (suoni per ogni personaggio)

#### Files da modificare

- `src/systems/DialogManager.ts`
- `src/config/constants.ts` (più dialoghi)

---

### 14. SISTEMA GIORNO/NOTTE

**Status:** [COMPLETATO]
**Tempo stimato:** 2-3 giorni
**Opzionale ma interessante**

#### Features

- [x] Ciclo giorno/notte basato su progressione
- [x] Lighting diverso per ogni fase:
- Mattina (luce calda)
- Pomeriggio (luce neutra)
- Sera (arancione)
- Notte (blu scuro, lanterne)
- [ ] NPC diversi in orari diversi
- [ ] Eventi speciali notturni
- [ ] Negozi/luoghi aperti solo in certi orari

#### Files da creare

- `src/systems/TimeManager.ts`

---

### 15. GESTIONE ERRORI

**Status:** [COMPLETATO]
**Tempo stimato:** 1 giorno

#### Da implementare

- [x] Try-catch su tutte le operazioni critiche
- [x] Error boundaries per scene
- [x] Fallback quando salvataggio corrotto
- [x] Logging errori (console + file?)
- [x] Messaggio user-friendly in caso di crash
- [x] Auto-recovery quando possibile
- [x] **Rewrite Texture Generation**: Sostituito `graphics.generateTexture` con `CanvasTexture` per stabilità 100%
- [x] **Safe Animation Playback**: Prevenzione crash per frame mancanti

#### Files da modificare

- Tutti i manager principali
- `src/systems/ErrorHandler.ts` (nuovo)
- `src/scenes/BootScene.ts` (refactor completo)

---

### 16. PERFORMANCE OPTIMIZATION

**Status:** [COMPLETATO]
**Tempo stimato:** 2 giorni

#### Ottimizzazioni

- [x] Object pooling per particelle (EffectsManager)
- [x] Destroy automatico oggetti fuori schermo
- [x] Texture atlas per ridurre draw calls
- [x] Limit particelle simultanee (max 100)
- [x] Riuso sprite invece di creare/distruggere
- [x] Profiling e identificazione bottleneck
- [x] Game Config: FPS limit (60) e batch size incrementato
- [x] BootScene: Texture cleanup on shutdown

#### Tools

- Chrome DevTools Performance
- Phaser Debug Panel

---

### 17. MOBILE SUPPORT

**Status:** [COMPLETATO]
**Tempo stimato:** 3-4 giorni
**Solo se vuoi pubblicare su mobile**

#### Da implementare

- [x] Virtual joystick (Movimento)
- [x] Virtual Action Button (Interazione 'E')
- [x] Touch controls per menu
- [x] UI responsive (scala automatica)
- [x] Gesture support (swipe, pinch)
- [x] Ottimizzazione performance mobile
- [x] Test su device reali

#### Files da creare

- `src/ui/VirtualJoystick.ts`
- `src/ui/VirtualActionBtn.ts`
- `src/utils/MobileDetector.ts`

---

### 18. CREDITS SCENE

**Status:** [COMPLETATO]
**Tempo stimato:** 1 giorno

#### Sezioni

- [x] Sviluppatore/Team
- [x] Musica e sound effects (con licenze)
- [x] Assets grafici utilizzati
- [x] Librerie (Phaser, TypeScript)
- [x] Playtester e ringraziamenti
- [x] Link social/website

#### Style

- Scroll automatico
- Stile cinematografico
- Musica dedicata
- Easter egg nascosto?

#### Files da creare

- `src/scenes/CreditsScene.ts`

---

### 19. GAME DESIGN DOCUMENT

**Status:** [COMPLETATO]
**Tempo stimato:** Ongoing
**Per te come riferimento**

#### Sezioni

- [x] Storia completa e lore
- [x] Albero delle scelte completo
- [x] Bilanciamento karma e endings
- [x] Mappa della progressione
- [x] Lista completa dialoghi
- [x] Meccaniche di gioco dettagliate
- [x] Art direction e mood board
- [x] Sound design plan

#### File

- `DESIGN.md`

---

## ROADMAP SUGGERITA

### FASE 1 - CORE (2-3 settimane)

**Obiettivo:** Rendere il gioco giocabile e completo

1. AudioManager + musiche/SFX base
2. PauseScene funzionale
3. SettingsScene con controlli
4. HUD con karma e obiettivi visibili
5. Feedback visivo base (shake, flash, particles)

**Deliverable:** Gioco giocabile dall'inizio alla fine con audio

---

### FASE 2 - POLISH (2 settimane)

**Obiettivo:** Migliorare la presentazione

1. Transizioni teatrali (sipario)
2. Dialoghi con ritratti
3. Menu principale migliorato
4. Minigame refinement

**Deliverable:** Gioco rifinito e presentabile

---

### FASE 3 - CONTENT (Ongoing)

**Obiettivo:** Aggiungere contenuto e rigiocabilità

1. Più dialoghi e branching
2. Achievement system
3. Endings multipli ben differenziati

**Deliverable:** Gioco con contenuto sostanzioso

---

### FASE 4 - FINAL (1-2 settimane pre-release)

**Obiettivo:** Preparare per il rilascio

1. Bug fixing completo
2. Performance optimization
3. Playtesting estensivo
4. Credits e polish finale
5. Build e packaging

**Deliverable:** Gioco pronto per release

---

## NOTE IMPLEMENTAZIONE

### Priority Legend

- [!!!] = Critico (devi farlo)
- [!!] = Molto importante (migliora molto l'esperienza)
- [!] = Importante (aggiunge valore)
- [?] = Nice to have (se hai tempo)

### Status Legend

- [COMPLETATO] = Completato
- [IN CORSO] = Parzialmente implementato
- [DA INIZIARE] = Non iniziato
- [LAVORAZIONE] = In lavorazione

---

## COME USARE QUESTA ROADMAP

1. **Scegli un item** dalla lista
2. **Leggi i requisiti** e stima il tempo
3. **Crea un branch** git (es: `feature/audio-system`)
4. **Implementa** seguendo le note
5. **Testa** la feature
6. **Aggiorna questo file** con
7. **Merge** e passa al prossimo

---

## PROSSIMI PASSI IMMEDIATI

**Consiglio di partire con questi 3:**

1. **AudioManager** (più impatto immediato sull'atmosfera)
2. **PauseScene** (standard necessario per ogni gioco)
3. **HUD con karma** (gameplay feedback essenziale)

**Vuoi che implementiamo uno di questi insieme?**
