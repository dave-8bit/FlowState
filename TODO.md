# TODO

## Milestone 3.2B — Real-time task synchronization (socket.io)

- [ ] Update `server/socket.js` to export `getIO()` while keeping all existing socket behavior unchanged.
- [ ] Update `server/routes/tasks.js` to emit `task:created`, `task:updated`, `task:deleted` only after successful Prisma operations, broadcasting to `user:${req.user.userId}`.
- [ ] Update `client/src/pages/TasksPage.jsx` to subscribe to socket events using `useSocket()` and upsert/remove tasks by `task.id` without refetch.
- [ ] Ensure all socket listeners are cleaned up on unmount.
- [ ] Verify lint/build (and run tests if present).

