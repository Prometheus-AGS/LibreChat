# Debugging LibreChat

This document outlines how to use the provided launch configurations to debug the LibreChat application in VS Code.

## Prerequisites

1.  **Docker Desktop**: Ensure Docker Desktop is installed and running.
2.  **VS Code Extension**: Install the [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) extension.
3.  **npm Dependencies**: Make sure all dependencies are installed by running `npm install` in the root directory.

## Debugging Configurations

This workspace contains the following launch configurations:

1.  **Debug Full Stack**: This is a compound configuration that launches both the Node.js API debugger and the Chrome debugger for the client-side application. This is the recommended way to debug the full application.
2.  **Launch Chrome against localhost**: This configuration launches a new Chrome instance and attaches the debugger to the client-side application running on `http://localhost:3000`.
3.  **Attach to Node API**: This configuration attaches the debugger to the running Node.js API on port `9229`.

## How to Start Debugging

1.  **Start the Debug Environment**: Open a terminal in the root of the project and run the following command:

    ```bash
    npm run debug
    ```

    This will start all the necessary services using the `docker-compose.dev.yml` file. The API will start in debug mode, listening on port `9229`.

2.  **Start Debugging in VS Code**:
    *   Go to the "Run and Debug" view in VS Code (you can use the shortcut `⇧⌘D` on macOS or `Ctrl+Shift+D` on Windows/Linux).
    *   Select **Debug Full Stack** from the dropdown menu.
    *   Click the "Start Debugging" button (the green play icon) or press `F5`.

This will:
*   Attach the debugger to the Node.js API.
*   Launch a new Chrome instance and attach the debugger to the client application.

You can now set breakpoints in both the server-side code (in the `api` directory) and the client-side code (in the `client` directory) and debug the application.