import { useCallback, useEffect, useMemo, useState } from 'react'

import { loadPlanningSettings, savePlanningSettings } from './planningStorage.js'
import { validatePlanningSettings } from './planningValidation.js'

const defaultSettings = {
  deadline: '',
  availableHoursPerDay: 4,
  preferredWorkStartTime: '09:00',
  preferredWorkEndTime: '17:00',
  preferredFocusMinutes: 25,
  // array form: ['Mon','Tue',...]
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  bufferDaysBeforeDeadline: 0,
}

export function usePlanningSettings() {
  const [settings, setSettings] = useState(() => {
    const stored = loadPlanningSettings()
    return stored ? { ...defaultSettings, ...stored } : defaultSettings
  })

  const validation = useMemo(() => validatePlanningSettings(settings), [settings])

  useEffect(() => {
    savePlanningSettings(settings)
  }, [settings])

  const setField = useCallback((field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }, [])

  const reset = useCallback(() => {
    setSettings(defaultSettings)
  }, [])

  return {
    settings,
    setField,
    validationErrors: validation.errors,
    isValid: validation.isValid,
    reset,
  }
}

