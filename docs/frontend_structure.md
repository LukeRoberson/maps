# Project Layout

## Entry Point

The entry point is in `index.html`, where the is a `div` tag with the id of `root`.

This div is targeted by `main.tsx`, which is the entrypoint to the React app.

This renders `App` in `app.tsx`, which references the rest of the components.

All routing is done on the client side. The `BrowserRouter` component from `react-router-dom` enables client-side routing.

</br></br>


## Folder Layout

```
.
└── frontend/                       # Frontend code
    ├── .eslintrc                       # ES Lint configuration
    ├── index.html                      # Main HTML entry point
    ├── package.json                    # App package file (metadata, dependancies, etc)
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── dist/                       # Distribution: Compiled TS/JS code
    ├── docs/                       # Documentation
    └── src/                        # Source code (TSX files)
        ├── main.tsx                    # Entrypoint for the React app
        ├── app.tsx                     # Main React app
        │
        ├── components/                 # Custom components
        │   ├── layout.tsx                  # <Layout /> component
        │   ├── layout.css                  # Styles for layout and children
        │   ├── export-dialog/
        │   └── layer-manager/
        │
        ├── pages/                      # Page routes
        │   ├── about.tsx                   # The /about page
        │   ├── about.css                   # Styles for /about
        │   ├── help.tsx                    # The /help page
        │   ├── help.css                    # Styles for /help
        │   ├── map-editor.tsx
        │   ├── map-editor.css
        │   ├── project-list.tsx            # Project list and management page
        │   ├── project-list.css            # Styles for project list page
        │   ├── use-project-list.ts         # Helper functions for project-list.tsx
        │   ├── project-card.tsx            # Helper functions for project-list.tsx
        │   ├── create-project-modal.tsx    # Helper functions for project-list.tsx
        │   ├── project-view.tsx
        │   └── project-view.css
        │
        ├── services/                   # Code that connects to external services (APIs)
        ├── styles/
        ├── types/                      # Datatype definitions (TS interfaces)
        ├── ??others??
```
