# F-CHIA Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
![Status](https://img.shields.io/badge/status-active-blue)
![Build](https://img.shields.io/badge/build-Vite-646CFF)
![React](https://img.shields.io/badge/React-19-61DAFB)

A diagram-driven implementation of the **Function-Centered Hazard Identification Approach (F-CHIA)**, enhanced with a **Design Matrix Model (DMM)** and fully visualized through **React Flow**.  
The tool transforms the original document-based methodology into a structured, interactive workflow that enforces correct analysis steps and improves traceability between functions and requirements.

You can access the tool online here:

👉 **https://congjin0523.github.io**

---

## 📚 Documentation

- **User Guidance** (How to use the tool):  
  👉 https://congjin0523.github.io/docs  
  👉 Or refer to: [`docs/md/guidance.md`](docs/md/guidance.md)

- **Examples** (Sample JSON data, analysis results pdf and fta):  
  👉 [`docs/example`](docs/example)

- **Build & Deployment** (How to build and host the app):
  👉 [`docs/md/build-and-deploy.md`](build-and-deploy)
---

## 📖 Table of Contents

- [F-CHIA Tool](#f-chia-tool)
  - [📚 Documentation](#-documentation)
  - [👉 `docs/md/build-and-deploy.md`](#-docsmdbuild-and-deploymd)
  - [📖 Table of Contents](#-table-of-contents)
  - [🚀 Features](#-features)
  - [🛠 Tech Stack](#-tech-stack)
    - [Frontend](#frontend)
    - [UI](#ui)
    - [Data \& State](#data--state)
    - [Visualization](#visualization)
    - [Routing \& Utilities](#routing--utilities)
  - [📸 Screenshots](#-screenshots)
  - [💻 Run it locally](#-run-it-locally)
  - [📄 License](#-license)

---

## 🚀 Features

- Visual F-CHIA workflow using React Flow  
- Auto-constrained node creation (enforces correct F-CHIA steps)  
- Match safety standard by LLM or munnal
- Function–Requirement DMM traceability  
- Integrated FTA generation  
- Export to JSON, PDF

---

## 🛠 Tech Stack

This project is implemented as a pure frontend **Single Page Application (SPA)** using the technologies below.
### Frontend
- [React 19](https://react.dev/) - UI framework for building modern web interfaces  
- [TypeScript](https://www.typescriptlang.org/) - Static typing for safer and more maintainable code  
- [Vite](https://vitejs.dev/) - Fast development server and build tooling

### UI
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development  
- [Radix UI](https://www.radix-ui.com/primitives/docs/overview/introduction) - Accessible UI primitives for React  
- [shadcn/ui](https://ui.shadcn.com/) - Composable UI components built on Radix primitives

### Data & State
- [Zustand](https://github.com/pmndrs/zustand) - State management for zones, graphs, tables, and FTAs  
- [Immer](https://immerjs.github.io/immer/) - Immutable updates with a mutable API

### Visualization
- [React Flow](https://reactflow.dev/) - Graph visualization and interactive node editing  
- [ELK.js](https://www.npmjs.com/package/elkjs) - Automatic graph layout engine  
- [html-to-image](https://github.com/bubkoo/html-to-image) - Convert React components to images  
- [jsPDF](https://github.com/parallax/jsPDF) - Generate PDF reports from exported visuals

### Routing & Utilities
- [React Router 7](https://reactrouter.com/) - Client-side routing for SPA navigation  
- [axios](https://axios-http.com/) - HTTP client for API communication  
- [react-hook-form](https://react-hook-form.com/) - Lightweight form management with React hooks  
- [zod](https://zod.dev/) - Runtime schema validation and type inference


---

## 📸 Screenshots
<img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/overall-layout.png?raw=1" width="400"/>

<img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/table.png?raw=1" width="400"/>

<img src="https://github.com/CongJin0523/F-CHIA-Tool/blob/main/docs/image/fta.png?raw=1" width="400"/>

---

## 💻 Run it locally

1. Install **Node.js 20+** (includes npm 10+).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the URL printed in the terminal (defaults to `http://localhost:5173`).
---

## 📄 License

This project is licensed under the **MIT License**.  
See the full license here: [LICENSE](./LICENSE)