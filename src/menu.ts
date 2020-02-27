import { Menu, MenuItemConstructorOptions, webContents } from "electron";

const template: MenuItemConstructorOptions[] = [
    {
        label: "File",
        submenu: [
            { label: "Load", click: () => { webContents.getFocusedWebContents()?.send("menu:load"); } },
            { label: "Save", click: () => { webContents.getFocusedWebContents()?.send("menu:save"); } },
            { label: "Save as", click: () => { webContents.getFocusedWebContents()?.send("menu:save_as"); } },
            { type: "separator" },
            { role: "quit" }
        ]
    },
    {
        label: "Edit",
        submenu: [
            { label: "Settings", click: () => { webContents.getFocusedWebContents()?.send("menu:settings"); } }
        ]
    }
];

export default Menu.buildFromTemplate(template);
