# PageCut

PageCut is a premium, client-side web application designed to split a PDF into custom page ranges. Built with Next.js, Tailwind CSS v4, and pdf-lib, it provides an elegant, locked app-shell experience where all file processing happens locally in the user's browser for maximum speed and absolute security.

---

## Key Features

* **Client-Side Architecture**: PDFs are processed entirely in the local browser. Your files never touch a server, ensuring 100% privacy and security.
* **Custom Range Splitting**: Define multiple page ranges (e.g. `1-5`, `10-20`) with custom labels. Ranges can overlap, and each range extracts into a separate, beautifully structured PDF file.
* **Unified Flat UI Design**: An elegant, distraction-free neutral visual language featuring custom thin scrollbars, smooth responsive grid structures, and a mobile-first app-shell.
* **Locked Viewport Layout**: Features a sticky header and fixed bottom actions bar, providing a native-app feel. Only the central lists (page ranges, download cards) scroll, maintaining focus and stability.
* **Range Persistence**: Click *"Adjust ranges"* to go back and refine your settings—your configuration is fully preserved in a lightweight session store.
* **Smart File Truncation**: Gracefully manages extremely long file names, keeping exactly three dots (`...`) right before the extension (e.g. `my_extremely_long_annual_report...pdf`) to protect visual hierarchy while retaining the extension.
* **Multi-Layer Validation**: Prevents out-of-bound ranges, negative pages, overlapping labels, or structural errors before compilation even starts.

---

## Technology Stack

* **Framework**: Next.js (App Router, Turbopack enabled)
* **Styling**: Tailwind CSS v4 (OKLCH palette, custom theme tokens)
* **Processing**: pdf-lib (High-performance JS PDF editing)
* **Icons**: Lucide React (Clean, modern outlines)
* **Tooling**: Biome (Fast format & lint tool)

---

## Getting Started

### Prerequisites

Ensure you have Node.js v20+ installed on your machine.

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```
   The application will run locally on `http://localhost:3001` (or next available port).

3. **Check Code Standards & Lints**:
   ```bash
   npm run lint
   ```

4. **Format Source Code**:
   ```bash
   npm run format
   ```

5. **Compile Production Bundle**:
   ```bash
   npm run build
   ```

---

## Docker Deployment (Port 3089)

We provide an optimized, multi-stage production Docker environment built on lightweight Alpine images to minimize package size and CPU overhead.

### Option A: Using Docker Compose (Recommended)

Docker Compose abstracts all build arguments into a clean configuration file. 

1. **Start the application** in detached mode (builds automatically if needed):
   ```bash
   docker compose up -d
   ```

2. **Follow runtime logs**:
   ```bash
   docker compose logs -f
   ```

3. **Stop the application**:
   ```bash
   docker compose down
   ```

### Option B: Using Standalone Docker Commands

1. **Build the Docker Image**:
   Navigate to the project root directory and build the container:
   ```bash
   docker build -t pagecut .
   ```

2. **Run the Container**:
   Spin up the container, mapping its internal production server to port **`3089`**:
   ```bash
   docker run -d -p 3089:3089 --name pagecut-app pagecut
   ```

3. **Stop the Container**:
   ```bash
   docker stop pagecut-app && docker rm pagecut-app
   ```

---

### Verify Deployment

Once started, open your browser and navigate to:
```url
http://localhost:3089
```

---

## Project Architecture

```txt
src/
├── app/
│   ├── configure/
│   │   └── page.tsx        # Configuration wizard route
│   ├── results/
│   │   └── page.tsx        # Compiled downloads list route
│   ├── globals.css         # Tailwind v4 theme configurations
│   ├── layout.tsx          # Root typography & Inter font setup
│   └── page.tsx            # Entrypoint (delegates to upload step)
├── components/
│   ├── configure-step.tsx  # Step 2: Scrollable range builder
│   ├── page-shell.tsx      # Unified app header & layout shell
│   ├── results-step.tsx    # Step 3: Local compiler & download manager
│   ├── step-bar.tsx        # Wizard step-progress tracker
│   └── upload-step.tsx     # Step 1: Centered drag-drop upload zone
└── lib/
    ├── pdf-extract.ts      # Browser-local pdf compilation & truncation
    └── pdf-session.ts      # In-memory transient session store
```

### Transient Memory Session Store
To maintain an elite speed benchmark, PageCut avoids writing temporary files or large File buffers to slow local storage/cookies. It utilizes a module-level transient singleton (`src/lib/pdf-session.ts`) to share File streams securely and directly across Next.js app routes, automatically cleaning up memory allocations when users complete their session or click *"Start Over"*.
