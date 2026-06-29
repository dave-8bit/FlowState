# TODO

## Tracking
- [ ] Milestone 4.4A: Roadmap Progress Tracking (true overall from persisted completed sessions)

### Current status
- Server updated: `GET /api/sessions?includeCompleted=true` returns active+completed sessions (completed sessions include participants for task mapping).
- Client not yet implemented.

### Next steps (client)
1. Add client API to fetch sessions history with `includeCompleted=true`.
2. In `TasksPage.jsx`, fetch completed sessions history (authenticated) and derive roadmap progress derived value:
   - completed taskIds from completed sessions participants.taskId
   - completed minutes from planned blocks whose taskId is in completed set
   - per-day completed/remaining counts derived from `planningSchedule`.
3. Pass derived progress props down:
   - `PlanningSummary -> RoadmapTimeline`.
4. Update `RoadmapTimeline.jsx` to render progress indicators without owning logic.
5. Run:
   - `npm --prefix client run lint`
   - `npm --prefix client run build`

### Next steps (server)
- Verify route file syntax and runtime behavior.

