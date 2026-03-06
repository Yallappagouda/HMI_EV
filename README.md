# Cognitive EV Charging HMI System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4-purple.svg)](https://vitejs.dev/)

A professional-grade, Cognitive Human-Machine Interface (HMI) for next-generation EV charging infrastructure. This system leverages adaptive behavioral detection and multimodal interaction to provide a seamless charging experience for all demographics.

---

## 1. Project Overview

The **Cognitive EV Charging HMI System** has been enhanced with multiple accessibility, automation, and smart interaction features to improve usability for both experienced and first-time EV users. By analyzing user interaction speed and patterns, the system dynamically reconfigures its UI/UX to match the user's cognitive profile.

---

## 2. System Architecture Overview

The system is built on a **Multimodal Interaction Framework** that separates behavioral logic from UI presentation.
- **Behavioral Engine**: Monitors user interaction time and errors to calculate proficiency.
- **Interaction Layer**: Handles simultaneous Voice, Touch, and Visual feedback.
- **Notification Engine**: Manages asynchronous SMS simulations during the charging lifecycle.
- **Safety Layer**: Implements Child Lock and Over-voltage monitoring with immediate UI/Voice response.

---

## 3. Updated Features List

### 3.1. Advanced Multimodal Interaction
- **Voice-Controlled Interface**: Full hands-free operation using Web Speech API (STT/TTS).
- **Gesture & Touch**: Optimized tap targets and haptic feedback.
- **Visual Guidance**: Real-time progress bars, animated hexagonal backgrounds, and high-contrast modes.

### 3.2. Adaptive User Modes
- **Guided Mode**: For first-time users. Includes an automated tutorial video and simplified dashboard (Power details hidden to reduce cognitive load).
- **Expert Mode**: For returning users. Direct access to Fast Charging (150 kW) and Normal Charging (50 kW) with detailed metrics.
- **Elderly/Accessibility Mode**: Automatically activated for slower interaction speeds, featuring larger text and enhanced spacing.

### 3.3. Lifecycle Simulation
- **Authentication**: simulated NFC/Card verification and mobile number validation.
- **Charging Dynamics**: Real-time simulation of power delivery, battery percentage, cost accumulation, and time estimation.
- **SMS Dashboard**: Integrated simulation of charging updates (Started, 80% complete, Finished) without interrupting the main dashboard UI.

### 3.4. Safety and Error Management
- **Intelligent 80% Limit**: Automatically prompts the user to "Continue" or "Stop" at the 80% charging threshold.
- **Overheat & Voltage Protection**: simulated safety triggers with dedicated error screens and troubleshooting steps.
- **Haptic & Audio Cues**: Tactile and audible confirmation for critical system states.

---

## 4. User Flow

The application follows a logical, cognitive-aware path:

1. **Home**: User selects proficiency level (First-time or Returning).
2. **Guided Path**: Tutorial Video → NFC/Mobile Authentication → Charging Dashboard.
3. **Expert Path**: Charge Mode Selection (Fast/Normal) → Authentication → Charging Dashboard.
4. **Charging**: Real-time monitoring → 80% prompt → Completion.
5. **Payment**: Final summary → Receipt download → Return home.

---

## 5. Multimodal Interaction Design

The HMI is designed to provide redundant feedback to ensure accessibility:
- **Visual**: Framer Motion animations for smooth transitions and high-glow elements for visibility.
- **Audio**: System voice instructions and notification beeps.
- **Tactile**: Haptic feedback for interactions like "Stop Charging" or successful authentication.
- **Text**: Context-aware SMS notifications simulated on a dedicated dashboard.

---

## 6. Voice Command System

The system implements a **Global Voice Recognition** strategy powered by the Web Speech API.

| Command | Action |
|---------|--------|
| "Start Charging" | Navigates to mode selection from home screen |
| "Stop Charging" | Triggers the stop confirmation popup |
| "Yes" / "No" | Confirms or cancels first-time path and stop actions |
| "Continue" | Navigates to the next screen (Video -> Auth -> Dashboard) |
| "Fast" / "Normal" | Selects the charging mode |
| "Go Back" | Navigates to the previous screen |

The system uses **Speech Synthesis (TTS)** to provide clear instructions, ensuring the microphone pauses while the system is speaking to prevent self-triggering.

---

## 7. Project Folder Structure

```text
src
 ├── components         # UI Modules (Authentication, Mic Button, SMS Dashboard, Mic Status)
 ├── context            # UserFlowContext for global state management
 ├── hooks              # useCognitive behavioral engine & Voice interaction hooks
 ├── pages              # Core screens (Tutorial Video, NFC Auth, Error Screens, History)
 ├── utils.js           # Shared Helpers (Haptics, Voice Synthesis, Audio Beeps)
 ├── App.jsx            # Central Router, Global Voice Handler, and UI State
 └── main.jsx           # Application entry point
```

---

## 8. Updated Flowchart of the Application

```text
Start  
↓  
User selects First-Time or Returning User  
↓  
Guided Mode → Tutorial Video → Authentication → Charging  
↓  
Expert Mode → Select Charging Mode (Fast / Normal) → Authentication → Charging  
↓  
Charging Screen → SMS Notifications → Stop Charging  
↓  
Payment Screen → Receipt  
```

---

## 9. Technology Stack

- **Frontend Core**: [React](https://reactjs.org/) (Version 18+)
- **Build Tool**: [Vite](https://vitejs.dev/) for ultra-fast development.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first design.
- **Animation**: [Framer Motion](https://www.framer.com/motion/) for premium UI transitions.
- **Voice Interaction**: [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (Recognition & Synthesis).
- **Routing**: [React Router](https://reactrouter.com/) for SPA navigation.
- **Icons**: [Lucide React](https://lucide.dev/) for modern iconography.

---

## 10. Deployment Information

The project is optimized for deployment on **Vercel**.
- **Live URL**: [ev-charging-rouge.vercel.app](https://ev-charging-rouge.vercel.app/)
- **Version Control**: Git & GitHub for collaborative development.
- **Continuous Integration**: Vercel's Git integration for automatic preview and production deployments.

---

## 11. Cognitive Logic Model (Proprietary)

The system calculates a **Proficiency Factor ($P$)**:
$$P = f(\Delta T, E_{count}, S_{usage})$$
Where Inter-interaction latency ($\Delta T$) and Error frequency ($E_{count}$) trigger real-time shifts into **Elderly or Guided mode** to minimize **Cognitive Load ($L$)**.

---

## 12. Future Improvements

- **Neural Interface Integration**: Exploring non-invasive BCI for basic status selection.
- **Biometric Authentication**: Facial recognition and fingerprint integration for secure sessions.
- **Live Energy Market Integration**: Dynamic pricing based on real-time grid load.
- **V2G Simulation**: Vehicle-to-Grid discharging capabilities for grid stabilization.
- **Multiple Language Support**: Expanding the system synthesis to 10+ languages.

---

## 13. Installation

### Setup
```bash
git clone https://github.com/Yallappagouda/HMI_EV_CHARGING
cd HMI_EV_CHARGING
npm install
npm run dev
```

---

## 14. License & Versioning

Distributed under the MIT License.
**Version**: 1.5.0  | **Last Updated**: 2026-03-06
