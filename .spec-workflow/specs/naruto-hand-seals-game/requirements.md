# Requirements: Naruto Hand Seals Game

## Overview

A browser-based 3D action game where players use real-world hand gestures (captured via webcam) to perform Naruto-style ninja seals and cast jutsu techniques to defeat enemies.

**Target Audience**: Naruto fans, casual gamers, users interested in gesture-based gaming

**Platform**: Web browser (desktop, requires webcam)

**Core Value Proposition**: Immersive gesture-based gameplay that brings the Naruto ninja experience to life

---

## User Stories

### Epic 1: Gesture Recognition System

#### US-1.1: Hand Gesture Detection
**As a** player
**I want** the game to accurately detect my hand gestures via webcam
**So that** I can perform ninja seals naturally without keyboard/mouse

**Acceptance Criteria**:
- [ ] Game requests webcam permission on launch
- [ ] Hand landmarks are tracked and displayed on video feed
- [ ] System recognizes 5 distinct hand gestures:
  - Open Palm (✋) → Fire Seal
  - Closed Fist (✊) → Water Seal
  - Pointing Up (☝️) → Thunder Seal
  - Thumbs Up (👍) → Wind Seal
  - Victory/Peace (✌️) → Earth Seal
- [ ] Gesture detection has <500ms latency
- [ ] Visual feedback shows detected gesture

**Given** player shows open palm to camera
**When** system processes video frame
**Then** Fire Seal is detected and displayed
**And** corresponding seal icon appears in UI

#### US-1.2: Gesture Cooldown
**As a** player
**I want** a short cooldown between gesture recognitions
**So that** accidental gestures don't trigger unintended seals

**Acceptance Criteria**:
- [ ] 500ms cooldown between seal detections
- [ ] Same gesture repeated quickly is ignored
- [ ] Different gestures can be inputted immediately

**Given** player performs Fire Seal
**When** player performs Fire Seal again within 500ms
**Then** second gesture is ignored
**But** player can immediately perform Water Seal

---

### Epic 2: Jutsu System

#### US-2.1: Seal Combination Display
**As a** player
**I want** to see my current seal sequence
**So that** I know which jutsu I'm building

**Acceptance Criteria**:
- [ ] Current seal sequence displayed in top-right corner
- [ ] Each seal shown as emoji icon (🔥💧⚡💨🗿)
- [ ] "Clear Seals" button available to reset sequence
- [ ] Empty state shows "Waiting for seals..."

**Given** player performs Fire Seal then Thunder Seal
**When** viewing seal sequence display
**Then** two icons are shown: 🔥 ⚡

#### US-2.2: Jutsu Casting
**As a** player
**I want** to automatically cast jutsu when I complete a seal sequence
**So that** I can attack enemies

**Acceptance Criteria**:
- [ ] Single-seal jutsu cast immediately:
  - 🔥 = Fireball (Fire Style)
  - 💧 = Water Dragon (Water Style)
  - ⚡ = Chidori (Lightning Style)
  - 💨 = Wind Blade (Wind Style)
  - 🗿 = Earth Wall (Earth Style)
- [ ] Combo jutsu available:
  - 🔥 + ⚡ = Fire-Thunder Burst (area damage)
- [ ] Jutsu projectiles launch from camera position toward enemies
- [ ] Visual effects match jutsu type (color, shape)
- [ ] Audio effects play on cast

**Given** player has 20 chakra and performs Fire Seal
**When** seal sequence matches Fireball jutsu
**Then** 20 chakra is consumed
**And** fireball projectile launches
**And** fire sound effect plays
**And** seal sequence clears

#### US-2.3: Chakra System
**As a** player
**I want** a chakra (energy) system
**So that** I must manage resources strategically

**Acceptance Criteria**:
- [ ] Player starts with 100/100 chakra
- [ ] Chakra bar displayed in top-left with visual indicator
- [ ] Each jutsu costs different chakra:
  - Fire: 20
  - Water: 25
  - Thunder: 30
  - Wind: 15
  - Earth: 40
  - Fire+Thunder: 50
- [ ] Chakra regenerates at 5/second
- [ ] Jutsu cannot be cast if insufficient chakra
- [ ] Low chakra (<20) shows warning color

**Given** player has 15 chakra
**When** player attempts to cast Fireball (20 cost)
**Then** jutsu does not cast
**And** seal sequence is NOT cleared (player can wait for regen)

---

### Epic 3: Enemy & Combat System

#### US-3.1: Enemy Spawning
**As a** player
**I want** enemies to spawn continuously
**So that** the game remains challenging

**Acceptance Criteria**:
- [ ] Enemies spawn every 2 seconds
- [ ] Maximum 4 enemies on screen simultaneously
- [ ] Enemies spawn at random positions on screen edges
- [ ] Enemies are colorful 3D cylinders (visual variety)
- [ ] Each enemy has 100 HP

**Given** 2 enemies exist and 2 seconds elapsed
**When** spawn timer triggers
**Then** new enemy appears at random edge position
**And** enemy count is now 3

#### US-3.2: Enemy Movement
**As a** player
**I want** enemies to move unpredictably
**So that** the game is dynamic and requires aim

**Acceptance Criteria**:
- [ ] Enemies move with random velocity vectors
- [ ] Enemies bounce off screen boundaries
- [ ] Enemies rotate continuously (visual effect)
- [ ] Movement speed is moderate (not too fast/slow)

**Given** enemy reaches screen boundary
**When** collision is detected
**Then** enemy velocity reverses on that axis
**And** enemy continues moving

#### US-3.3: Hit Detection
**As a** player
**I want** jutsu to damage and destroy enemies
**So that** I can progress and increase score

**Acceptance Criteria**:
- [ ] Collision detected when jutsu within 1 unit of enemy
- [ ] Enemy HP reduced by jutsu damage amount
- [ ] Enemy destroyed when HP <= 0
- [ ] Explosion particle effect on enemy death
- [ ] Hit sound effect plays
- [ ] Explosion sound effect on death

**Given** fireball (30 damage) hits enemy (100 HP)
**When** collision detected
**Then** enemy HP becomes 70
**And** hit sound plays
**And** fireball is destroyed

---

### Epic 4: Scoring & Progression

#### US-4.1: Score System
**As a** player
**I want** to earn points for defeating enemies
**So that** I can track my performance

**Acceptance Criteria**:
- [ ] Score displayed in top-left corner
- [ ] Base points: 100 per enemy defeated
- [ ] Combo multiplier increases score
- [ ] Score persists throughout session
- [ ] High score shown on game over

**Given** player defeats enemy with 3x combo
**When** enemy is destroyed
**Then** player receives 300 points (100 × 3)

#### US-4.2: Combo System
**As a** player
**I want** consecutive hits to build combo multipliers
**So that** skillful play is rewarded

**Acceptance Criteria**:
- [ ] Combo starts at 1x
- [ ] Each hit within 3 seconds increases combo (+1x)
- [ ] Combo resets to 0 after 3 seconds of no hits
- [ ] Combo multiplier shown prominently (e.g., "5x COMBO!")
- [ ] Combo text animates/pulses for emphasis
- [ ] Combo countdown timer visible

**Given** player hits enemy
**When** 3.5 seconds pass with no additional hits
**Then** combo resets to 0
**And** combo display disappears

---

### Epic 5: Audio & Visual Feedback

#### US-5.1: Sound Effects
**As a** player
**I want** audio feedback for all actions
**So that** the game feels responsive and immersive

**Acceptance Criteria**:
- [ ] Background music plays continuously
- [ ] Seal detection sound (different per seal type)
- [ ] Jutsu cast sound (different per jutsu type)
- [ ] Hit sound effect
- [ ] Explosion sound effect
- [ ] Mute button available
- [ ] Audio settings persist

**Given** player clicks mute button
**When** any sound would play
**Then** sound is suppressed
**And** mute icon shows "muted" state

#### US-5.2: Visual Effects
**As a** player
**I want** satisfying visual effects
**So that** the game is visually engaging

**Acceptance Criteria**:
- [ ] 3D starfield background (1000 stars)
- [ ] Hand skeleton overlay on webcam feed
- [ ] Jutsu projectiles with color-coded spheres
- [ ] Particle explosions on enemy death
- [ ] Smooth camera movements
- [ ] Chakra bar with gradient fill

**Given** enemy is destroyed
**When** death triggered
**Then** 20 colored particles scatter outward
**And** particles fade over 1 second

---

### Epic 6: UI & Game Flow

#### US-6.1: Start Screen
**As a** player
**I want** a clear start screen
**So that** I understand controls before playing

**Acceptance Criteria**:
- [ ] Title: "火影结印游戏" (Naruto Hand Seals Game)
- [ ] "Start Game" button
- [ ] Two-column layout showing:
  - Left: Gesture Guide (hand = seal mapping)
  - Right: Jutsu Guide (seal combinations)
- [ ] Example combo shown (🔥 + ⚡ = Fire-Thunder Burst)
- [ ] Large, readable icons (text-6xl size)
- [ ] Grid layout for clean organization

**Given** game first loads
**When** player views start screen
**Then** all controls are clearly explained
**And** player can click "Start Game" to begin

#### US-6.2: HUD Layout
**As a** player
**I want** a clean, non-intrusive HUD
**So that** I can focus on gameplay

**Acceptance Criteria**:
- [ ] Top-left: Chakra bar, Score, Combo (if active), Mute button
- [ ] Top-right: Current seal sequence
- [ ] Bottom-right: Webcam feed (320x240) with hand skeleton overlay
- [ ] Bottom-center: Jutsu cheat sheet
- [ ] All elements have semi-transparent backgrounds
- [ ] Orange/fire theme for borders and accents

**Given** player is in-game
**When** viewing HUD
**Then** all critical info is visible
**And** 3D game scene is not obscured

#### US-6.3: Game Over
**As a** player
**I want** to see game over stats
**So that** I can evaluate my performance

**Acceptance Criteria**:
- [ ] "Game Over" screen shown when player loses
- [ ] Final score displayed prominently
- [ ] Highest combo displayed
- [ ] "Restart" button available
- [ ] Background dimmed but still visible

**Given** player reaches game over condition
**When** game over screen appears
**Then** stats are shown clearly
**And** player can click restart to play again

---

## Non-Functional Requirements

### NFR-1: Performance
- [ ] Stable 60 FPS on modern desktop browsers
- [ ] Gesture recognition latency <500ms
- [ ] Smooth 3D rendering without frame drops
- [ ] Memory usage <200MB

### NFR-2: Compatibility
- [ ] Supported browsers: Chrome 100+, Edge 100+, Firefox 100+
- [ ] Webcam required (game gracefully handles permission denial)
- [ ] Desktop only (mobile not supported due to webcam positioning)

### NFR-3: Accessibility
- [ ] Keyboard "Clear Seals" button available
- [ ] Visual indicators for all audio events
- [ ] High contrast UI elements
- [ ] Mute option available

### NFR-4: User Experience
- [ ] Game state persists until manual restart
- [ ] Immediate visual feedback for all player actions
- [ ] Intuitive gesture-to-seal mappings
- [ ] Forgiving gesture recognition (not overly strict)

---

## Edge Cases & Error Handling

### EC-1: Webcam Issues
**Scenario**: User denies webcam permission
**Behavior**: Show friendly error message with instructions to enable

**Scenario**: Webcam disconnects mid-game
**Behavior**: Pause game, show reconnection prompt

### EC-2: Performance Degradation
**Scenario**: FPS drops below 30
**Behavior**: Reduce particle effects, show performance warning

### EC-3: Gesture Recognition Failures
**Scenario**: Hand partially visible
**Behavior**: Continue tracking, wait for full hand visibility

**Scenario**: Poor lighting conditions
**Behavior**: Show lighting quality indicator, suggest improvements

### EC-4: Resource Management
**Scenario**: 10+ enemies spawn (bug condition)
**Behavior**: Hard cap at 10 enemies, prevent further spawning

---

## Success Criteria

This spec is considered complete when:

- [ ] All user stories are implemented and tested
- [ ] All acceptance criteria pass verification
- [ ] Performance benchmarks met (60 FPS, <500ms latency)
- [ ] Edge cases handled gracefully
- [ ] User can play a complete game loop without errors
- [ ] Audio and visual feedback are polished
- [ ] Code follows React Three Fiber and MediaPipe best practices

---

**Spec Status**: ✅ Complete (Game Already Implemented)
**Created**: 2026-02-06
**Version**: 1.0
**Next Phase**: Design Documentation
