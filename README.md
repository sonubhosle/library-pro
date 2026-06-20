# 📚 LibraryPro - Premium Library Management System

LibraryPro is a production-ready, feature-rich desktop application built with **Electron**, **React**, and **SQLite**. It offers a premium user experience with smooth animations, real-time statistics, and advanced book/student management.

---

## ✨ Key Features

-   🏠 **Dynamic Dashboard**: Real-time stats on total books, students, and circulation.
-   🌓 **Dual Theme Support**: Beautiful Dark and Light modes with smooth transitions.
-   📖 **Advanced Book Management**: Complete CRUD supporting categories, pricing, and availability.
-   👥 **Student Directory**: Profile management and history tracking.
-   📦 **Auto-Updater**: Production-ready update system (Electron-Updater).
-   📊 **Excel Export**: Generate reports for inventory and transactions instantly.
-   ✉️ **Email Notifications**: Overdue reminders, fine payment confirmations, invoice alerts.
-   🔐 **Secure Auth**: JWT-based session persistence and encrypted password storage.

---

## 🛠 Tech Stack

-   **Frontend**: React.js, Tailwind CSS, Lucide Icons, Recharts (for Analytics).
-   **Backend**: Electron.js, Node.js.
-   **Database**: SQLite (via `better-sqlite3` and `Drizzle ORM`).
-   **Animations**: Custom CSS Keyframes & Framer Motion logic.

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [npm](https://www.npmjs.com/) (installed with Node)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone <your-repo-url>
    cd library-pro
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Database**
    The app automatically handles database creation and migrations on first launch. If you need to manually run migrations:
    ```bash
    npm run migrate
    ```

### Troubleshooting Installation Errors
If you experience errors relating to `better-sqlite3`, `node-gyp`, or `ENOTFOUND` during `npm install` on a new system, this is usually caused by network or proxy issues. `node-gyp` needs to download C++ Node.js headers from `nodejs.org`, or pre-built binaries from Github.
1. **Internet Connection / DNS**: Ensure you have an active network connection that is not blocking Github or Nodejs domains.
2. **Proxy / VPN**: If your system is behind a proxy, set npm's proxy settings:
   ```bash
   npm config set proxy http://your-proxy-server:port
   npm config set https-proxy http://your-proxy-server:port
   ```
3. **Permission Issues (EPERM)**: If you see `EPERM` or `operation not permitted`, ensure your code IDE (like VSCode) or another terminal isn't already accessing the `node_modules` folder, then delete the `node_modules` folder, clear cache, and reinstall:
   ```bash
   npm cache clean --force
   npm install
   ```

---

## 💻 Development

Start the Vite development server and Electron simultaneously:

```bash
npm run dev
```

### Handling "Locked Database" Errors
If you see a "Database is busy" or "cannot access file" error during development:
1. Close all app windows.
2. Run the cleanup command:
   ```powershell
   taskkill /F /IM node.exe /T ; taskkill /F /IM electron.exe /T
   ```

---

## 🏗 Building for Production

### Windows Build
To generate a production `.exe` installer:

```bash
npm run build:win
```
The installer will be generated in the `dist-electron` folder.

---

## 📁 Project Structure

```text
├── electron/
│   ├── db/              # SQLite Schema & Migrations
│   ├── ipc/             # Inter-Process Communication handlers
│   ├── services/         # Backend business logic (Auth, Books, etc.)
│   └── main.js          # Electron Entry Point
├── src/
│   ├── components/      # UI & Layout components
│   ├── pages/           # Application views (Dashboard, Books, etc.)
│   ├── store/           # Global state management (Zustand)
│   └── index.css        # Premium style definitions
└── package.json         # Scripts & Dependencies
```

---

## 📄 License

This project is licensed under the MIT License. Built with ❤️ for Modern Libraries.
