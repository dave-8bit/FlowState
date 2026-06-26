import { useState } from 'react'
import { useBrainDump } from '../features/brainDump/brainDumpHooks.js'
import { useTaskActions } from '../features/tasks/taskHooks.js'
import './BrainDumpPage.css'

function normalizePriority(priority) {
  if (!priority) return 'LOW'
  const p = String(priority).trim().toUpperCase()
  if (p === 'CRITICAL') return 'CRITICAL'
  if (p === 'HIGH') return 'HIGH'
  if (p === 'MEDIUM') return 'MEDIUM'
  if (p === 'LOW') return 'LOW'
  return 'LOW'
}

export default function BrainDumpPage() {
  const [input, setInput] = useState('')
  const { loading, error, tasks, generate } = useBrainDump()
  const { loading: saving, error: saveError, createTasks } = useTaskActions()
  const [saveSuccess, setSaveSuccess] = useState(false)

  return (
    <div className="brainDumpPage">
      <div className="brainDumpHeader">
        <h1 className="brainDumpTitle">FlowState Brain Dump</h1>
        <p className="brainDumpSubtitle">
          Turn your thoughts into actionable tasks—fast.
        </p>
      </div>

      <div className="brainDumpForm">
        <div className="brainDumpField">
          <label className="brainDumpLabel" htmlFor="brainDumpInput">
            Brain dump
          </label>
          <textarea
            id="brainDumpInput"
            className="brainDumpTextarea"
            value={input}
            placeholder="Dump everything on your mind..."
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="brainDumpActions">
          <button
            type="button"
            onClick={() => {
              setSaveSuccess(false)
              generate(input)
            }}
            disabled={loading}
            className="brainDumpButton"
          >
            {loading ? 'Generating...' : 'Generate Tasks'}
          </button>
        </div>

        {error ? <div className="brainDumpError">Unable to generate tasks right now. Please try again.</div> : null}
      </div>

      <div className="brainDumpResults">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          <>
            <div className="brainDumpResultsHeader">Generated tasks</div>

            <div className="brainDumpActions" style={{ marginTop: 0, marginBottom: 14 }}>
              <button
                type="button"
                onClick={async () => {
                  setSaveSuccess(false)
                  const created = await createTasks(tasks)
                  if (created && Array.isArray(created)) setSaveSuccess(true)
                }}
                disabled={saving}
                className="brainDumpButton"
              >
                {saving ? 'Saving...' : 'Save Generated Tasks'}
              </button>
            </div>

            {saveError ? (
              <div className="brainDumpError">Unable to save your changes. Please try again.</div>
            ) : null}
            {saveSuccess ? <div className="brainDumpError" style={{ color: '#16a34a' }}>Saved!</div> : null}

            <div className="brainDumpCards">
              {tasks.map((task, idx) => {
                const priority = normalizePriority(task?.priority)
                return (
                  <div
                    key={task?.id ?? idx}
                    className="brainDumpCard"
                    aria-label={`Task ${idx + 1}`}
                  >
                    <div className="brainDumpCardTop">
                      <h3 className="brainDumpCardTitle">{task?.title}</h3>
                      <div className={`brainDumpBadge brainDumpBadge--${priority}`}>
                        {priority}
                      </div>
                    </div>

                    <div className="brainDumpMeta">
                      <div>
                        <span className="brainDumpMetaLabel">Priority:</span>{' '}
                        {priority}
                      </div>
                      <div>
                        <span className="brainDumpMetaLabel">Estimated Minutes:</span>{' '}
                        {task?.estimatedMinutes}
                      </div>
                    </div>

                    <p className="brainDumpDescription">{task?.description}</p>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div>No tasks yet.</div>
        )}
      </div>
    </div>
  )
}




