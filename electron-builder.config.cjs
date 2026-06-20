module.exports = {
    appId: "com.librarypro.app",
    productName: "LibraryPro",
    copyright: "Copyright © 2026 LibraryPro",
    directories: {
        output: "dist-electron"
    },
    files: [
        "dist/**/*",
        "electron/**/*",
        "assets/**/*"
    ],
    win: {
        target: [{ target: "nsis", arch: ["x64", "ia32"] }],

        publisherName: "LibraryPro"
    },
    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: "LibraryPro",



        include: "build/installer.nsh"
    },
    publish: {
        provider: "generic",
        url: "https://your-update-server.com/releases/"
    },
    extraResources: [
        { from: "electron/db/migrations", to: "migrations" }
    ]
}
