# Floatie

A lightweight, always-on-top browser for the multitaskers out there. Watch videos, browse the web, or just procrastinate—all while your main window stays in focus.  Now with **multi-tab support** for even better productivity!

## What's the point?

Honestly, I built this because I got tired of alt-tabbing between my browser and VS Code while trying to follow a tutorial. Why can't I just have a tiny browser floating on top that stays there? So I made one.

Floatie is basically a desktop browser (powered by Electron) that doesn't care about being on top of everything else. It's got the basics—back, forward, refresh, and a URL bar. No ads, no unnecessary bloat, just a window that won't get in your way but will always be there when you need it. Plus, you can now open multiple tabs to juggle different websites without losing your place.

Perfect for:
- Watching tutorials while coding
- Monitoring dashboards without switching tabs
- Following documentation while building
- Literally anything that needs two (or more) things at once
- Researching multiple sources at once

## Tech Stack

- **Electron** - Because building a desktop app in JavaScript is weird but actually pretty cool
- **Chromium** - Full browser engine for seamless web compatibility
- **JavaScript** - Vanilla, no fancy frameworks needed for this one
- **HTML/CSS** - Keep it simple
- **macOS** - Currently macOS only (Windows/Linux support maybe someday)

## Getting Started

### Prerequisites
- Node.js (v14 or higher, I think. Whatever you have is probably fine)
- npm (comes with Node)
- macOS (seriously, that's the only OS it works on right now)

### Installation

```bash
# Clone the repo
git clone https://github.com/SE7EN2028/Floatie.git
cd Floatie

# Install dependencies
npm install

# Run it
npm start
```

That's it. The app should pop open. If it doesn't, check if you actually installed dependencies.
This process was for the nerds, if you just want the application it's right there in the google drive folder given in the repo's description.

## How to Use

1. **Open Floatie** - Double-click the app or run `npm start`
2. **Type a URL** - Click the address bar, type something like `youtube.com` or `google.com`
3. **Press Enter** - It navigates (obviously)
4. **Use the buttons** - Back, forward, refresh work like any browser
5. **Open new tabs** - Click the "+" button to create a new tab and manage multiple pages
6. **Switch between tabs** - Click any tab to switch, close with the X button
7. **Resize it** - Drag the edges to make it bigger or smaller
8. **Pin/Unpin** - Click the pin button to toggle always-on-top (it stays pinned by default)

The window will stay on top of everything unless you unpin it. It remembers your last position and size, so it'll open in the same spot next time.

## Features

- **Always on Top** - Self-explanatory. It hovers above everything.
- **Resizable** - Drag the edges, make it tiny or bigger
- **Bookmarks** - Save pages you visit (honestly not sure if this is fully working, haven't tested it much)
- **Standard Browser Controls** - Back, forward, refresh. The essentials.
- **Lightweight** - Doesn't take up much space. Way less than having two browser windows open.
- **Multi-Tab Support** - Open multiple websites and switch between them seamlessly.
- **Full Chromium Engine** - Better compatibility and modern web support

## Known Issues / Limitations

- **macOS only** - Yeah, I know. Windows and Linux users, I see you. Maybe I'll get to it.
- **No history sync** - It tracks history locally, but that's it
- **Bookmarks might be broken** - I added the feature but... don't rely on it yet
- **It's not a full browser** - No extensions, no syncing, no password manager. It's literally just a floating window that loads websites.

## What I Learned Building This

- Electron is actually pretty intuitive once you get the main/renderer process thing
- IPC (Inter-Process Communication) is both powerful and confusing at the same time
- Always-on-top is harder to implement cross-platform than you'd think
- Keeping things simple is underrated

## Future Ideas (Maybe)

- Actual working bookmarks
- Windows/Linux versions
- Keyboard shortcuts
- Settings page (change window size presets, etc.)
- Dark mode (for the late-night coders)

None of these are guaranteed. This is more of a passion project than anything else.

## Architecture (If You Care)

```
Floatie/
├── src/
│   ├── main.js          # Electron main process, window stuff
│   ├── index.html       # UI template
│   ├── index.js         # Renderer process, browser controls
│   └── styles.css       # Make it look okay
├── package.json         # Dependencies and stuff
└── README.md           # This file
```

**Main Process** handles the actual window creation and keeps it on top. **Renderer Process** is just regular web dev—buttons, input fields, click handlers. They talk to each other through IPC (it's cool but also confusing).

## Development

Want to modify it? Go ahead. Here's how:

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# It auto-reloads on file changes (kind of, sometimes you need to manually refresh)
```

Open DevTools with `Cmd+Option+I` to debug stuff.

## Building

Haven't really packaged this for distribution properly yet. That's a whole other thing (electron-builder, code signing, all that fun stuff). If you want to build it, hit me up or figure it out yourself.

## License

MIT or whatever. Use it, modify it, don't sue me.

## FAQ

**Q: Will this work on Windows?**
A: Not yet. Electron makes it easy to port, but I haven't gotten around to it.

**Q: Can I have multiple Floatie windows?**
A: Technically no, but maybe someday.

**Q: Does it use much memory?**
A: It's an Electron app, so... it uses memory. Not as much as Chrome though.

**Q: Is this production-ready?**
A: It works for me. That's all I can say.

## Contributing

Found a bug? Have a feature idea? Feel free to open an issue. PRs are welcome but no promises I'll merge anything. This is mostly a side project.

## Credits

Built by Ritik Anand because I was annoyed at multitasking.

Inspired by the frustration of remembering I can't have two windows side-by-side when I really need to.

---

If you actually use this, let me know. I'd find that pretty cool.

Also sorry for any bugs. I tested it on my machine and it worked, so... 🤷
