# Flagon demo hub

A GitHub Pages-friendly React SPA for focused Flagon product demonstrations. Hash routes keep every scenario directly linkable without requiring server-side rewrite support.

The first scenario, `#/feature-flags`, demonstrates browser-safe evaluation through the OpenFeature React SDK and the community OFREP web provider. The provider handles evaluation caching, `ETag` validators, visibility refresh, and 15-second conditional polling.

The hub shows only functional scenarios. A small coming-soon note leaves room for future demos without presenting unfinished product cards.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `VITE_FLAGON_CLIENT_TOKEN` to a publishable client token created on the Feature Flags page. You can also leave it empty and enter a token through the demo's connection drawer; that token stays in local storage.

When Flagon itself is running locally, use `http://localhost:3000/api` as the provider URL. The production provider URL is `https://api.flagon.io`. The official provider appends `/ofrep/v1` itself; localhost retains the internal `/api` prefix.

## Demo flag

Create one string flag:

| Key | Type | Variants | Default |
| --- | --- | --- | --- |
| `demo-experience` | String | `control="control"`, `modern="modern"`, `bold="bold"` | control |

The demo evaluates it with `{ "targetingKey": "demo-user" }`. Change the served variant in Flagon; the OpenFeature hook updates the page without a reload on the provider's next refresh. **Refresh now** forces an immediate conditional refresh.

Application code uses the vendor-neutral OpenFeature API:

```tsx
const { value, variant, reason } = useStringFlagDetails("demo-experience", "control");
```

Flagon is configured only at the provider boundary:

```tsx
OpenFeature.setProvider(
  new OFREPWebProvider({
    baseUrl: "https://api.flagon.io",
    headers: [["Authorization", `Bearer ${clientToken}`]],
    pollInterval: 15_000,
  }),
  { targetingKey: "demo-user" },
);
```

## GitHub Pages

The included workflow tests and builds every push to `main`, then deploys `dist` to GitHub Pages. To pre-connect the hosted demo:

1. Add a repository Actions secret named `FLAGON_CLIENT_TOKEN`.
2. In repository Settings → Pages, choose **GitHub Actions** as the source.
3. Point the `demo.flagon.io` DNS record at GitHub Pages. The checked-in `public/CNAME` preserves the custom domain on deployment.

Client tokens are publishable, read-only credentials. The build secret avoids committing the value, but Vite embeds it into the browser bundle by design.
