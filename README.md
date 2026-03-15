# Rodmon

A visual roadmap / node-mapping client-side web application where users can organize information using connected nodes (Blobs) on a large interactive worksheet canvas.

All data is saved entirely locally within your browser using IndexedDB. No server database is required.

## Features

- **Infinite Canvas:** Pan and zoom freely around a large workspace.
- **Blobs (Nodes):** Create, move, color-code, and connect information nodes.
- **Connections:** Visually map relationships between ideas using directional edges.
- **Rich Data:** Write detailed information for each Blob using Markdown format.
- **Worksheet Management:** Create multiple worksheets, easily switch between them, rename, or delete them.
- **Local Persistence:** Everything happens securely inside your browser's local storage.
- **Import / Export:** Download your worksheet maps as `.json` files and share them or back them up.

## Prerequisites

To run this application, you must have [Node.js](https://nodejs.org/) installed on your computer.

## How to Run Locally

If you are opening this project for the first time or need to reinstall dependencies:

1. **Open a terminal** (Command Prompt, PowerShell, or Git Bash).
2. **Navigate to the project directory:**
   ```bash
   cd c:\Mine\Projects\Rodmon
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```

### Starting the Development Server

Whenever you want to run and use the application:

1. Open your terminal and ensure you are in the project folder:
   ```bash
   cd c:\Mine\Projects\Rodmon
   ```
2. Start the local Vite server:
   ```bash
   npm run dev
   ```
3. Open your web browser (Chrome, Edge, Firefox, etc.) and go to the local URL provided in the terminal, which is usually:
   ```
   http://localhost:5173
   ```

## Keyboard Shortcuts & Controls

- **Pan Canvas:** Click and drag an empty space on the canvas.
- **Zoom Canvas:** Scroll up/down using your mouse wheel.
- **Move Node:** Click and drag a Blob to move it.
- **Select Node:** Click on a Blob to open the right-hand editor panel.
- **Create Connection:** Hover over a Blob, click on one of the colored circular handles along its edge, and drag a line to another Blob's handle.
- **Create New Blob:** Use the **"Add Blob"** button in the top toolbar, or press the `N` key on your keyboard when you aren't typing inside an input box.
- **Local Search:** Press `F` to open the search bar for the current worksheet. Press `Enter` or `Shift + Enter` to cycle through matches.
- **Global Search:** Press `Shift + F` to open the comprehensive search modal that spans all your worksheets.
- **Toggle Selection Mode:** Use the **"Select"** toggle in the top toolbar to disable panning if you need to drag a selection box around multiple nodes.
- **Show Minimap:** Click the map icon in the top toolbar to see a zoomed-out preview of your entire worksheet.

## Build for Production

If you ever wish to bundle the application to be hosted on a static web server (like GitHub Pages, Vercel, or Netlify):

```bash
npm run build
```
This will generate optimized files in the `/dist` folder.
