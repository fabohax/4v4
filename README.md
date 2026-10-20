<div align="center">

# 4V4 — 3D Mod Marketplace on Stacks

**Create, mint, list, and trade 3D models as NFTs.**

[![Stacks](https://img.shields.io/badge/Blockchain-Stacks-5546FF)](https://www.stacks.co/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-000000?logo=next.js)](https://nextjs.org/)
[![Clarity](https://img.shields.io/badge/Contracts-Clarity-5546FF)](https://docs.stacks.co/clarity)
[![Development status](https://img.shields.io/badge/status-development-orange)](#project-status)

![4V4 NFT Marketplace on Stacks](./4v4-screenshot.png)

</div>

4V4 is a digital playground for 3D mods, built on the Stacks blockchain. This full-stack dApp lets users mint, list, and trade 3D models as NFTs using L2 satoshis. It combines Clarity smart contracts, a Next.js frontend, and Hiro developer tools.

> [!WARNING]
> **Development project:** the smart contracts have not been audited and are not intended for production use.

## Contents

- [Features](#features)
- [Project status](#project-status)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [License](#license)

## Features

- Mint 3D models to user wallets as NFTs
- List models for sale with optional takers, expiries, and batch operations
- Trade NFTs using STX and SIP-010 tokens; sBTC support is planned
- Set per-NFT royalties through `get-royalty-info`
- Transfer NFTs with SIP-009 ownership support
- Browse paginated listings
- Connect Hiro wallets for Devnet testing

## Project status

4V4 is under development and intended for local development and testing. Features and contract behavior may change.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Smart contracts | Clarity, Clarinet |
| Blockchain | Stacks |
| Wallet and developer tooling | Hiro Platform |

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm, Yarn, or pnpm
- A [Hiro Platform](https://platform.hiro.so) account with a Devnet project
- Recommended: [Clarinet](https://github.com/hirosystems/clarinet) and the [Clarity VS Code extension](https://marketplace.visualstudio.com/items?itemName=HiroSystems.clarity-lsp)

### 1. Start a Hiro Devnet

1. Sign in to [Hiro Platform](https://platform.hiro.so).
2. Start Devnet in your project.
3. Copy the API key from the Devnet API or project settings.

### 2. Install dependencies

From the repository root, install dependencies for both the contracts and frontend:

```bash
git clone https://github.com/fabohax/4v4.git
cd 4v4

cd clarity
npm install

cd ../front-end
npm install
cp .env.example .env
```

Add your Hiro Platform API key to `front-end/.env`:

```dotenv
NEXT_PUBLIC_PLATFORM_HIRO_API_KEY=your-api-key-here
```

### 3. Run the frontend

From the `front-end` directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

See the repository [LICENSE](./LICENSE) file.

---

<div align="center">Open source, built with ♥️</div>
