# 4V4 — Roadmap from MVP to mainnet

[Read this roadmap in Spanish](devroad.es.md).

## Goal

Take 4V4 from its current prototype—a Stacks marketplace for 3D models, with files and metadata on IPFS—to a small, secure, operable mainnet dapp. Each phase ends with verifiable exit criteria; completing a phase does not automatically authorize a mainnet deployment.

## Starting point

- The Next.js frontend already has explore, account, and upload pages, plus API routes for files and supporting services.
- `clarity/contracts/model-market.clar` implements listing, price updates, delisting, STX purchases, and listing reads.
- Development changes are in progress. Clarinet tests still refer to older contracts and functions, so they cannot reliably validate the current contract until they are aligned.
- `clarity/Clarinet.toml` contains a development account recovery phrase. Treat it as exposed: invalidate that account and remove the secret from the file and repository history before using any account or credential with real value.

## Phases

### 0. Secure the development foundation

**Work**

- Invalidate the exposed recovery phrase; use new accounts per environment and keep secrets outside the repository.
- Set the product source of truth: the `model-market` contract and the CID/metadata format used by the frontend and indexer.
- Align Clarinet tests and scripts with the current contract. Make installation, contract checks, linting, and frontend builds reproducible from one guide.
- Separate local, testnet, and mainnet configuration; prevent test builds from accidentally targeting mainnet.

**Exit criteria:** no active secrets in the repository, contract and tests agree, and local setup is reproducible.

### 1. Functional local/Devnet MVP

**Minimum scope**

- Connect and disconnect a Stacks wallet; show the active network and address.
- Upload a model, preview, and metadata JSON to IPFS with type and size validation. Keep Pinata credentials on the server only.
- Submit a listing from the wallet and show transaction states: pending, confirmed, or failed.
- Browse active listings, view the 3D model and its details, buy in STX, update the price, and delist.
- Allow upload or read retries when a transaction or gateway fails, without silently creating duplicate listings.

**Exit criteria:** one user can list an asset and another can buy it on Devnet; the UI matches the state confirmed on Stacks.

### 2. Product and data MVP

- Document and fix the metadata schema, CID limits, supported 3D formats, content license, and moderation rules.
- Add persistence or indexing for catalog search and browsing. The contract remains authoritative for ownership, price, and activity; the index can be rebuilt from chain events/state.
- Design empty states and handle wallet errors, replaced transactions, indexing delays, and unavailable content.
- Add pagination and query limits. Never trust browser data for price, seller, or authorization.
- Define pinning and file-recovery policies; a CID alone does not guarantee availability.

**Exit criteria:** the catalog is usable, its data can be recovered, and broken content, latency, and errors are handled clearly.

### 3. Contract hardening and security

- Review the ownership and economic model: a purchase currently changes the recorded seller and closes the listing; it does not create a transferable NFT or apply a commission/royalty. Confirm this meets the product requirements before freezing the UI.
- Specify invariants and errors: seller authorization, positive prices, self-purchases, duplicate purchases, delisting, relisting, and exact STX transfers.
- Add unit and property/edge-case tests for every public function and read; verify rollback behavior and ensure failures cannot leave partial state.
- Review CID length and validation limits. Do not present parameters as verified by the UI when the contract cannot verify them.
- Obtain an independent contract review and resolve its findings. Freeze the source and deployment artifacts after review.

**Exit criteria:** approved specification, complete contract test suite, and no unresolved critical or high findings from the independent review.

### 4. Testnet and operational rehearsal

- Deploy the candidate to Stacks testnet with a dedicated deployment account and test funds.
- Test end to end with real testnet wallets: listing, purchase, delisting, price update, and recovery from errors.
- Validate explorer links, event/state reads, fee estimation, RPC/API configuration, and IPFS persistence.
- Run a documented deployment rehearsal and ensure the frontend clearly identifies the network and contract address.
- Prepare monitoring for API failures, gateway/IPFS availability, and transactions; assign an owner and response procedure.

**Exit criteria:** repeatable rehearsal, documented operations, and no blocking defects in critical flows.

### 5. Mainnet launch gate

Require every item below before deployment:

- Explicit approval of scope, ownership model, fees, and content terms.
- Independent review/audit completed, with source code matching the reviewed artifact exactly.
- Protected deployment keys, separated from operational keys, with a recovery procedure; no secrets in Git or the client.
- Contract addresses, network, explorer links, limits, and parameters checked by two people.
- Deployment, verification, and communication plan; pause/containment mechanism if the contract supports it. If the contract is immutable, document that there is no automatic pause or migration.
- Support policy, security contact, monitoring, data retention/backups, and incident response ready.

**Exit criteria:** checklist signed by technical and product owners. Mainnet deployment remains a separate, deliberate decision.

### 6. Controlled launch and maintenance

- Launch with limited scope and operational limits that match available support.
- Verify the contract address and make a low-risk test transaction before announcing the launch.
- Monitor transaction errors, indexing, and content availability; communicate incidents and status changes clearly.
- Maintain a process for reports, content removal under the policy, and frontend/API updates that do not silently change on-chain rules.

## Out of MVP scope

Auctions, royalties, standard NFT tokens, payments in other assets, social messaging, and governance. Each expands contract scope and security review; add it only after a product decision and a new assessment.

## Definition of “mainnet-ready”

It does not just mean the contract compiles or the site loads. Critical flows must be tested on testnet, assets and secrets must be managed with operational controls, the contract must receive an independent review, product limits must be visible, and there must be a real incident and support plan.
