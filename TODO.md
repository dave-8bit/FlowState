# TODO
- [ ] Remove cleanup function from `useAuthBootstrap` so it never clears JWT on unmount.
- [ ] Ensure the hook only: reads `?token=`, stores in `localStorage`, removes it from URL, and then exits.
- [ ] Verify no other code depends on `clearToken()` from this hook.

