# Excelsior NFT Membership

Excelsior NFT Membership is a React web app for browsing Excelsior membership NFTs and managing membership metadata on-chain. It connects to EVM wallets with RainbowKit and Wagmi, reads NFT data from the configured collection contract, and displays each token's metadata and ownership.

## Features

- Browse the configured membership collection and its NFTs.
- Connect an EVM wallet.
- View token metadata and ownership; token holders and contract operators can request private membership codes.
- Access an operator dashboard to search minted tokens and edit NFT attributes. Saving changes uploads metadata through the configured worker and updates the token URI on-chain.
- The dashboard is restricted to wallets with the contract's `OPERATOR_ROLE`.

The homepage also describes membership benefits. Booking, payment, and concierge workflows are not implemented in this frontend.

## Tech stack

- React 19 and TypeScript
- Vite 7
- React Router
- RainbowKit, Wagmi, Viem, and TanStack Query

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- An EVM wallet for wallet-connected and operator features

## Run locally

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check and create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | Run the TypeScript compiler without emitting files. |
| `npm run lint` | Run ESLint. |
| `npm run lint:fix` | Run ESLint and apply automatic fixes. |
| `npm run format` | Format TypeScript and CSS files under `src/`. |

## Routes

| Path | Page |
| --- | --- |
| `/` | Membership landing page |
| `/collections` | Configured collection catalogue |
| `/collection/:collectionId` | NFTs in a collection, such as `/collection/premium` |
| `/dashboard` or `/admin` | Operator dashboard |

## Configuration

The active collection and its contract address are defined in [`src/config/contracts.ts`](./src/config/contracts.ts); the contract ABI is in [`src/contracts/ExcelsiorMembershipNFT8.json`](./src/contracts/ExcelsiorMembershipNFT8.json). The repository currently configures one collection, `Premium Suites`. Update these source files when changing the collection or contract.

Wallet connection supports the chains configured in [`src/main.tsx`](./src/main.tsx). The frontend's collection configuration is currently source-controlled; `VITE_CONTRACT_ADDRESS` and `VITE_BASE_GOERLI_RPC_URL` in `.env.example` are not currently read by the application.

The NFT card reads `VITE_ADMIN_TOKEN` for private-code API requests. If your API deployment requires this value, set it in a local environment file such as `.env.local` before starting or building the app:

```dotenv
VITE_ADMIN_TOKEN=your-value
```

**Important:** Vite embeds `VITE_*` values in client-side JavaScript. Never put a private or privileged secret in `VITE_ADMIN_TOKEN`; treat it as publicly visible and enforce authorization in the API.

## Production build

```bash
npm run build
npm run preview
```

The generated site is in `dist/`. Deploy it to a static host configured to serve the app entry point for the client-side routes above.
