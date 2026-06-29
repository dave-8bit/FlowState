# TODO

## Milestone 4.2B
- [x] Keep Start Focus button inside RoadmapTimeline.
- [x] Run `npm run lint` and `npm run build`.

## Milestone 4.4A — Client-Side Roadmap Progress Tracking
### Backend
- [x] Update `GET /api/sessions?includeCompleted=true` to return active+completed sessions (participants included). (server/routes/sessions.js)

### Client (remaining scope)
- [ ] Add client API helper (if needed) to fetch `/api/sessions?includeCompleted=true`.
- [ ] Fetch completed sessions in `client/src/pages/TasksPage.jsx`.
- [ ] Derive progress deterministically by matching `participant.taskId` to roadmap focus blocks.
- [ ] Pass only derived progress data into `PlanningSummary` and `RoadmapTimeline`.
- [ ] Update `RoadmapTimeline` to visually distinguish completed/active/remaining blocks and display overall % complete.
- [ ] Run `npm --prefix client run lint` and `npm --prefix client run build` and report results.

