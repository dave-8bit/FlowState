- [ ] Inspect RoadmapTimeline.jsx title rendering paths for any raw taskId display
- [ ] Implement minimal fix: ensure title fallback never renders `Task ${taskId}` or raw DB IDs; use only `title → tasksById[taskId]?.title → "Untitled Task"`
- [ ] Update TODO/checklist
- [ ] Run: npm --prefix client run lint
- [ ] Run: npm --prefix client run build
- [ ] Report: files modified, exact code path used for title resolution, lint result, build result

