# showcase-local reset workflow

This workflow is the destructive recovery path for a lost keystore passphrase or a full local reset.
It returns the embedded runtime to a blank first-run state.

## What gets deleted

By default, showcase-local stores local runtime state under these paths:

- `.local-data/keystore.json`
- `.local-data/keystore.json.runtime`
- `.local-data/node-profiles`

If `LOCAL_KEYSTORE_PATH` is set, replace `.local-data/keystore.json` with that custom path and delete the matching `<keystore>.runtime` directory instead.

## Reset steps

1. Stop any running local node from the UI if it is active.
2. Close any clients that are using the embedded runtime.
3. Remove the persisted keystore and runtime state.

Default local layout:

```bash
rm -rf \
  .local-data/keystore.json \
  .local-data/keystore.json.runtime \
  .local-data/node-profiles
```

Custom keystore path:

```bash
rm -rf "$LOCAL_KEYSTORE_PATH" "$LOCAL_KEYSTORE_PATH.runtime" .local-data/node-profiles
```

4. Reload showcase-local.
5. Confirm the keystore status shows the blank/setup-required state before creating or importing a new wallet root.

## Notes

- This reset is intentionally not exposed as an HTTP route.
- The reset deletes wallet roots, wallet-scoped network state, tracked contract state, and local node profile data.
- Use this only when you explicitly want to start over.
