import { app, protocol, BrowserWindow } from "electron";
// import {
//     createProtocol,
//     /* installVueDevtools */
// } from "vue-cli-plugin-electron-builder/lib";

import * as path from "path";
import { readFile } from "fs";
import { URL } from "url";

import "./main/index";

const isDevelopment = process.env.NODE_ENV !== "production";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win: BrowserWindow | null;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: "app", privileges: { secure: true, standard: true, supportFetchAPI: true, stream: true } },
]);

const createProtocol = (scheme: string) => {
    protocol.registerBufferProtocol(scheme, (request, respond) => {
        let pathName = new URL(request.url).pathname;
        pathName = decodeURI(pathName); // Needed in case URL contains spaces

        readFile(path.join(__dirname, pathName), (error, data) => {
            if (error) {
                console.error(`Failed to read ${pathName} on ${scheme} protocol`, error);
            }
            const extension = path.extname(pathName).toLowerCase();
            let mimeType = "";

            if (extension === ".js") {
                mimeType = "text/javascript";
            } else if (extension === ".html") {
                mimeType = "text/html";
            } else if (extension === ".css") {
                mimeType = "text/css";
            } else if (extension === ".svg" || extension === ".svgz") {
                mimeType = "image/svg+xml";
            } else if (extension === ".json") {
                mimeType = "application/json";
            } else if (extension === ".wasm") {
                mimeType = "application/wasm";
            }

            respond({ mimeType, data });
        });
    });
};

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false,
        },
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
        if (!process.env.IS_TEST) {
            win.webContents.openDevTools();
        }
    } else {
        createProtocol("app");
        // Load the index.html when not in development
        win.loadURL("app://./index.html");
    }

    win.on("closed", () => {
        win = null;
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        // Devtools extensions are broken in Electron 6.0.0 and greater
        // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
        // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
        // If you are not using Windows 10 dark mode, you may uncomment these lines
        // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
        // try {
        //   await installVueDevtools()
        // } catch (e) {
        //   console.error('Vue Devtools failed to install:', e.toString())
        // }
    }
    createWindow();
});

/*app.on("render-process-gone", (...args) => {
    console.log("CRASHED", ...args);
});*/

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === "win32") {
        process.on("message", (data) => {
            if (data === "graceful-exit") {
                app.quit();
            }
        });
    } else {
        process.on("SIGTERM", () => {
            app.quit();
        });
    }
}
