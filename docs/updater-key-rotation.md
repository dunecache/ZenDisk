# Updater key rotation

The updater public key is baked into every installed client. A client rejects any
update whose signature does not match the key it shipped with, so replacing the
signing key is **not** a configuration-only change.

The current key is password-protected and was generated before any real
installs. This document describes the procedure for a future rotation **after**
installs exist.

## Two-key bridge procedure

Use temporary secret names so the active signing key is never overwritten
mid-release. Let `OLD` be the currently trusted key and `NEW` the replacement.

1. **Generate `NEW`.** Use a temporary `ubuntu-latest` workflow with
   `npx @tauri-apps/cli signer generate --ci -w <path> -p <password>`. Store the
   private key and password as new secrets (for example
   `TAURI_SIGNING_PRIVATE_KEY_NEW` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD_NEW`)
   and commit the new public key only in the bridge release (step 2), not on
   `main` yet.
2. **Build and publish a bridge release signed with `OLD`.** Temporarily point
   CI at the `OLD` secrets, but set `plugins.updater.pubkey` in
   `tauri.conf.json` to the `NEW` public key. Existing clients trust the `OLD`
   signature and accept the update; after installing it, they trust `NEW`.
3. **Keep the bridge release published** until the installed base has adopted
   it. There is no update telemetry today, so this needs a support/announcement
   window rather than an automated check.
4. **Switch CI to `NEW`.** Restore the normal configuration with `NEW` secrets
   and the `NEW` public key, then publish the next version. It will be signed
   with `NEW` and accepted by clients that installed the bridge.
5. **Verify the chain on Windows 10/11:** install a build with `OLD`, update to
   the bridge, then update to a `NEW`-signed build. Confirm each step's
   signature and that the version increases.
6. **Retire `OLD` only after adoption.** Keep the old private key and password
   offline indefinitely: they are the only way to sign another bridge release
   for a client that skipped the first one.

## If the active key is compromised

There is no silent recovery: a compromised key cannot safely sign a bridge.
Affected users must reinstall manually from a trusted source. Rotating early and
keeping backups offline is the mitigation.

## Backup requirements

GitHub Actions secrets cannot be read back. Store the private key and password:

- in a password manager, and
- in one offline copy kept separately from the repository.

Never commit the private key or password. The public key is safe to commit.
