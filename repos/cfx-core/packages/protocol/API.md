# framework/protocol — Public API

> Conflux-specific protocol features that aren't generic EVM. Conservative scope.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/protocol/sponsor` | sponsor mechanism (Core space) |
| `@cfxdevkit/protocol/cross-space` | eSpace ↔ Core bridge |
| `@cfxdevkit/protocol/staking` | PoS staking helpers |
| `@cfxdevkit/protocol/storage` | storage collateral helpers |

---

## `protocol/sponsor`

```
type SponsorInfo = {
  gasSponsor: Address
  gasSponsorBalance: Wei
  collateralSponsor: Address
  collateralSponsorBalance: Wei
  upperBound: Wei
}

function readSponsorInfo(input: { client: Client; contract: Address; signal?: AbortSignal }): Promise<SponsorInfo>
function setSponsorForGas(input: { client: Client; signer: Signer; contract: Address; upperBound: Wei; value: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function setSponsorForCollateral(input: { client: Client; signer: Signer; contract: Address; value: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function addPrivilege(input: { client: Client; signer: Signer; contract: Address; users: readonly Address[]; signal?: AbortSignal }): Promise<{ hash: Hash }>
function removePrivilege(input: { client: Client; signer: Signer; contract: Address; users: readonly Address[]; signal?: AbortSignal }): Promise<{ hash: Hash }>
```

---

## `protocol/cross-space`

```
function transferEspaceToCore(input: { client: Client; signer: Signer; from: 'espace'; toCoreAddress: string; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function transferCoreToEspace(input: { client: Client; signer: Signer; from: 'core'; toEspaceAddress: Address; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function readBridgeState(input: { client: Client; signal?: AbortSignal }): Promise<{ paused: boolean; minAmount: Wei }>
```

---

## `protocol/staking`

```
function deposit(input: { client: Client; signer: Signer; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function withdraw(input: { client: Client; signer: Signer; amount: Wei; signal?: AbortSignal }): Promise<{ hash: Hash }>
function getStakeBalance(input: { client: Client; address: Address; signal?: AbortSignal }): Promise<Wei>
function getVotePower(input: { client: Client; address: Address; blockNumber?: bigint; signal?: AbortSignal }): Promise<bigint>
```

---

## `protocol/storage`

```
function getCollateralForStorage(input: { client: Client; address: Address; signal?: AbortSignal }): Promise<Wei>
function getSponsoredCollateral(input: { client: Client; contract: Address; signal?: AbortSignal }): Promise<Wei>
```

---

## Notes

- Protocol package is **read-and-narrow-write**. Anything that's "do these 5 calls
  in sequence to bootstrap a sponsorship" belongs in `domains/` or in a project's
  own scripts — not here.
- All errors are `ContractError` from `core/contract` (no new error class needed).
