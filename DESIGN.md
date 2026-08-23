# Design System: JAGESTORE (Stitch Semantic Specification)

## 1. Visual Theme & Atmosphere
JAGESTORE is a high-speed, premium game top-up platform engineered with a sleek, dark-slate gaming aesthetic. The interface balances high-information density with spacious tactical clarity.
- **Density Score (1–10):** `6` (Balanced, fast transactional flow, clear product grids)
- **Variance Score (1–10):** `7` (Asymmetric layout splits, dynamic badge highlights)
- **Motion Intensity (1–10):** `6` (Tactile spring clicks, subtle status pulses, skeletal transitions)
- **Mood:** Tactical, ultra-responsive, trustworthy, friction-free checkout.

---

## 2. Color Palette & Roles

| Token Name | Hex / Value | Functional Role |
| :--- | :--- | :--- |
| **Canvas Dark** | `#090D16` | Main page background (deep navy slate, not pure black) |
| **Surface Raised** | `#121826` | Card background, container surfaces, form sections |
| **Surface Overlay** | `#1B2436` | Selected product cards, hover overlays, modal surfaces |
| **Primary Accent** | `#0284C7` | Primary buttons, active selections, focus rings |
| **Accent Glow Soft** | `rgba(2, 132, 199, 0.15)` | Subtle selection halos (strictly non-neon) |
| **Success Emerald** | `#10B981` | Completed orders, online status, verified ID badge |
| **Warning Amber** | `#F59E0B` | Pending status, discount tags, special promo badges |
| **Error Crimson** | `#EF4444` | Validation errors, failed transactions, critical alerts |
| **Text Heading** | `#F8FAFC` | Main headings, prices, key labels (Slate-50) |
| **Text Body** | `#94A3B8` | Descriptions, secondary labels, helper text (Slate-400) |
| **Border Whisper** | `rgba(148, 163, 184, 0.12)` | 1px clean hairline section borders and dividers |
| **Border Active** | `rgba(2, 132, 199, 0.60)` | Active selection borders |

> **Color Constraints:**
> - Strictly NO pure black (`#000000`).
> - Strictly NO AI purple/magenta button gradients.
> - Maximum 1 dominant accent color (`#0284C7`) across CTAs and active states.

---

## 3. Typography Architecture

- **Display & Section Titles:** `Outfit`, sans-serif (Weights: 600, 700)
  - Tight letter-spacing (`letter-spacing: -0.02em`), compact line-height.
- **Body & Form Text:** `Geist` or `Satoshi`, sans-serif (Weights: 400, 500)
  - Relaxed leading (`line-height: 1.55`), maximum 65 characters per line.
- **Numbers, Prices, SKUs & Order IDs:** `JetBrains Mono` or `Geist Mono`, monospace
  - Used for prices (`Rp31.010`), Order IDs (`MLTOP-178...`), and timer counters.
- **Banned Typography:** `Inter` (generic default), generic serif fonts (`Times New Roman`, `Georgia`).

---

## 4. Component Stylings & Behaviors

### Buttons & CTAs
- **Primary CTA (`.cta-pay`):** Solid Primary Accent fill, bold text, `border-radius: 12px`, tactile active state (`transform: translateY(1px)`). No outer neon glow.
- **Secondary / Action Buttons:** Ghost background with `Border Whisper` outline, transitioning to `Surface Overlay` on hover.
- **Disabled State:** Reduced opacity (`0.45`), cursor not-allowed, no hover transitions.

### Product & Denomination Cards
- **Structure:** 2-column or 3-column responsive grid with `12px` gaps.
- **Dimensions:** Compact vertical cards containing diamond count, bonus tag, and price tag in monospace.
- **Selected State:** Border switches to `Border Active`, background shifts to `Surface Overlay`, subtle corner check icon.
- **Badges:** Small, pill-shaped tags in top corner (`POPULER`, `HEMAT 5%`) with restrained saturation.

### Form Inputs & Account Verification
- **Input Fields:** Floating-free clean inputs with top labels, dark surface fill (`#0C111D`), hairline borders (`Border Whisper`).
- **Focus State:** 2px focus ring using `Border Active`.
- **Validation Feedback:** Inline status banner immediately under inputs. Emerald pill when nickname is verified (`✓ ᴊoʜɴ wᴀʏɴᴇ`).

### Payment Method Cards
- **Layout:** Grouped by category (QRIS Instan, E-Wallet, Virtual Account).
- **Logos:** High-contrast clean monochrome or official logo badges in a flex container.
- **Badge:** `0% BIAYA ADMIN` pill badge in muted green/amber.

### Loading & Transition States
- **Loaders:** Skeleton shimmer rectangles matching exact layout dimensions (no spinning circles).
- **Status Indicators:** Micro-pulsing colored dot (`8px`) next to live order state.

---

## 5. Layout & Responsive Architecture

- **Container:** Centered max-width container (`1180px` on desktop, `100%` on mobile with `16px` lateral padding).
- **Hero & Ordering Split:**
  - **Desktop (≥ 1024px):** 2-Column layout — Left column (Account Data + Product Selection), Right sticky column (Order Summary + Payment + Instant CTA).
  - **Mobile (< 768px):** Single vertical stack with sticky bottom checkout bar. Zero horizontal overflow.
- **Spacing Scale:** Standard 4px base scale (`8px`, `12px`, `16px`, `24px`, `32px`, `48px`).

---

## 6. Motion Philosophy & Micro-Interactions

- **Spring Dynamics:** `stiffness: 120, damping: 18` for natural, weighty tactile clicks.
- **Micro-Motion:** Continuous subtle pulse on pending payment timers and live QRIS detection status.
- **Transitions:** All state changes (hover, active, focus) animated strictly via `transform` and `opacity` (duration `150ms–200ms ease-out`).

---

## 7. Anti-Patterns & Banned Elements

- ❌ **NO Emojis in Core UI Buttons:** Use clean SVG icons (Lucide/Heroicons) instead of emoji characters.
- ❌ **NO Generic AI Purple/Pink Glows:** Stick to calibrated slate/navy base and single blue/cyan accent.
- ❌ **NO Cliché AI Copy:** Avoid terms like "Unleash", "Elevate", "Next-Gen". Use direct Indonesian gaming copy: *"Top Up Instan 24 Jam"*, *"Otomatis Masuk Detik Ini"*.
- ❌ **NO Horizontal Overflow on Mobile:** Every component must fit `100dvw`.
- ❌ **NO Unchecked User Inputs:** Always provide immediate visual confirmation on User ID validation.
