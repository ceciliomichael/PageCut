# PageCut

PageCut is a simple, elegant, and secure web application designed to split and merge PDF documents. All processing is executed locally in the browser, meaning files are never uploaded to any remote server.

---

## What It Is For

PageCut is built to help individuals and businesses easily split large PDFs into targeted segments, or combine multiple PDF files into one clean document. Whether you need to save a single chapter from a digital textbook, separate monthly reports from a consolidated yearly file, or merge several independent documents into a single presentation, PageCut handles these tasks with ease.

Key features include:
* **Split and Extract**: Upload a single PDF and extract specific page ranges (such as pages 1-5, and pages 10-12) into separate downloadable files.
* **Merge PDFs**: Combine multiple PDFs into a single document. You can easily drag files to reorder them and even specify exactly which pages to include from each file.
* **Custom Labels**: Assign custom names to your split files so that your documents are neatly organized as soon as they are downloaded.
* **Adjustable Workflows**: Go back and adjust your selected page ranges or file order at any point during your session without needing to re-upload your documents.
* **Friendly and Clean Interface**: A distraction-free visual workspace designed to be comfortable and simple to navigate.

---

## Why It Was Built

Standard online utilities for managing PDFs often introduce privacy, security, and usability challenges. PageCut was created to address these specific issues:

### Absolute Data Privacy
Traditional web-based PDF tools require you to upload your files to their external servers. If your documents contain sensitive personal information, proprietary business details, or financial records, this represents a significant data security risk. PageCut operates entirely on your local device—your files never leave your computer.

### High-Speed Processing
Uploading large PDF files to the cloud can be slow, depending on your internet connection. Since PageCut processes files locally using your browser's capabilities, the splitting and merging are nearly instantaneous.

### Professional and Focused Experience
Many free web utilities are cluttered with distracting advertisements, pop-ups, and complex, confusing navigation steps. PageCut provides a clean, premium, and unified interface focused solely on getting your tasks done efficiently.

---

## How It Works (Project Architecture)

The application is structured into clearly separated areas, ensuring the system remains easy to maintain and extend:

* **App Routes (`src/app/`)**: Manages the distinct steps and screen views of the application—including the main home dashboard, the split and merge workflows, configuration views, and download pages.
* **User Interface Components (`src/components/`)**: Houses the visual elements of the application, including the drag-and-drop file upload zones, step navigation trackers, file reordering tools, and page-range inputs.
* **Local Processing Engine (`src/lib/`)**: Contains the core logic responsible for performing the PDF extraction (`pdf-extract.ts`, `pdf-split.ts`) and combining (`pdf-merge.ts`) directly inside your browser, as well as the lightweight session manager (`pdf-session.ts`) that holds your documents active while you work.

---

## Getting Started

### Prerequisites

You will need Node.js version 20 or higher installed on your computer.

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3001` (or the port specified in your terminal).

3. **Check code quality**:
   ```bash
   npm run lint
   ```

4. **Automatically format code**:
   ```bash
   npm run format
   ```

---

## Running with Docker

For production or isolated deployments, a Docker configuration is provided.

### Option A: Using Docker Compose

1. **Start the application**:
   ```bash
   docker compose up -d
   ```

2. **Stop the application**:
   ```bash
   docker compose down
   ```

### Option B: Using Standalone Docker Commands

1. **Build the container image**:
   ```bash
   docker build -t pagecut .
   ```

2. **Run the container (on port 3089)**:
   ```bash
   docker run -d -p 3089:3089 --name pagecut-app pagecut
   ```

3. **Stop and remove the container**:
   ```bash
   docker stop pagecut-app && docker rm pagecut-app
   ```

Once running via Docker, access the application by visiting `http://localhost:3089` in your web browser.
