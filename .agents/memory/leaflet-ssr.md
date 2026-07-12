---
name: Leaflet SSR fix
description: How to safely use Leaflet/react-leaflet in a TanStack Start (Vite SSR) app without "window is not defined" crashes.
---

# Problem
Leaflet references `window` at the top level of its module. Importing it (or react-leaflet) in any file that is evaluated during SSR causes `ReferenceError: window is not defined` and breaks the server renderer.

# Solution
Split the Leaflet code into a dedicated inner component file (e.g. `LeafletMapView.tsx`, `LeafletPickerInner.tsx`) that is **never imported at the top level** of any SSR-rendered route or component. Instead, load it dynamically inside a `useEffect` (which only runs client-side):

```tsx
const [MapView, setMapView] = useState<typeof LeafletMapViewType | null>(null);
useEffect(() => {
  import("@/components/LeafletMapView").then(m => setMapView(() => m.LeafletMapView));
}, []);
```

Show a "Loading map…" placeholder until the component resolves.

**Why:** `useEffect` is never executed on the server, so the dynamic `import()` is never triggered server-side. The SSR bundle never sees `leaflet` and the crash is avoided.

**How to apply:** Any time you add a new Leaflet/react-leaflet component, put all the Leaflet code in a separate `*Inner.tsx` or `*Leaflet.tsx` file and load it dynamically in the parent wrapper.
