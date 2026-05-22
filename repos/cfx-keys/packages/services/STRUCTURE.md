# @cfxdevkit/services

## Root  
.gitignore — Git ignore rules  
API.md — Public API documentation  
README.md — Package overview and usage  
STRUCTURE.md — This file  
moon.yml — MoonScript build configuration  
package.json — Package metadata and dependencies  

## src/  
auth/ — Authentication and token management  
  index.ts — Entry point for auth module  
  nonces.test.ts — Tests for nonce generation  
  nonces.ts — Nonce generation and validation  
  token.test.ts — Tests for token handling  
  token.ts — JWT-like token creation and verification  

crypto/ — Core cryptographic primitives  
  aead.ts — Authenticated encryption with associated data  
  constants.ts — Shared crypto constants  
  encoding.ts — Base encoding utilities (e.g., base64, hex)  
  errors.ts — Custom crypto error types  
  index.test.ts — Integration tests for crypto module  
  index.ts — Entry point for crypto module  
  kdf.ts — Key derivation functions  
  keys.ts — Key generation and management  
  random.ts — Cryptographically secure random utilities  

embedded-wallet/ — Embedded wallet service logic  
  index.ts — Entry point for embedded wallet  
  manager.test.ts — Tests for wallet manager  
  manager.ts — Wallet lifecycle and session management  
  types.ts — Shared type definitions  

index.test.ts — Top-level integration tests  
index.ts — Main entry point for the package  

keystore/ — Key storage backends and management  
  audit.test.ts — Tests for keystore audit logging  
  audit.ts — Audit trail utilities  
  file/ — File-based keystore implementation  
    index.test.ts — Tests for file keystore  
    index.ts — Entry point for file keystore  
    internals.ts — Internal helpers for file keystore  
  index.test.ts — Tests for keystore module entry  
  index.ts — Entry point for keystore module  
  ledger/ — Ledger hardware wallet integration  
    core-apdu.ts — APDU command handling for Ledger  
    core-framing.test.ts — Tests for Ledger framing protocol  
    core-framing.ts — Ledger transport framing logic  
    core-transaction.ts — Ledger transaction signing logic  
    index.test.ts — Tests for Ledger integration  
    index.ts — Entry point for Ledger provider  
    provider.ts — Ledger device provider abstraction  
    signature.ts — Ledger signature utilities  
    signer.ts — Ledger-based key signer  
    transport.ts — Ledger transport layer  
    types.ts — Ledger-specific type definitions  
  memory/ — In-memory keystore implementation  
    capability.test.ts — Tests for capability-based access  
    capability.ts — Capability-based access control  
    index.test.ts — Tests for memory keystore  
    index.ts — Entry point for memory keystore  

## Config  
tsconfig.json — TypeScript compiler options  
vite.config.ts — Vite build configuration  
vitest.config.ts — Vitest test runner configuration

<!-- structure-status: enriched -->
<!-- structure-hash: 868ee4a5725174f11fb6d037a68cec0b271950993d6b238371ca6fed7c0cef8b -->
