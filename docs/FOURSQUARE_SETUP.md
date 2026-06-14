# Foursquare Places Setup

AroundU uses a Cloudflare Worker as a free proxy for nearby venue discovery.
The Foursquare service key stays in Cloudflare and is never bundled into Expo.
The Worker also validates the caller's Firebase ID token before using the key.

## Deploy The Worker

1. Create a free Cloudflare account.
2. Open the Worker directory and install its dependency:

```bash
cd workers/foursquare-proxy
npm install
```

3. Sign in to Cloudflare:

```bash
npx wrangler login
```

4. Add the Foursquare service key:

```bash
npx wrangler secret put FOURSQUARE_API_KEY
```

5. Add the Firebase Web API key from the existing Expo `.env`:

```bash
npx wrangler secret put FIREBASE_WEB_API_KEY
```

6. Deploy:

```bash
npm run deploy
```

Wrangler prints a URL such as:

```text
https://aroundu-foursquare-proxy.<account>.workers.dev
```

Add that URL to the root `.env`:

```env
EXPO_PUBLIC_FOURSQUARE_WORKER_URL=https://aroundu-foursquare-proxy.<account>.workers.dev
```

Restart Expo after changing `.env`.

## Cost Control

The proxy caps searches at 25 km and 25 venues. Foursquare usage is still
subject to the plan attached to the developer account, so monitor its console.
Cloudflare Workers also has free-plan limits.

Foursquare supplies venue data only. The native base map is still rendered by
`react-native-maps`, as required by the project constraints.
