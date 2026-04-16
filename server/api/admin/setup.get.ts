import { getRuntimeSetupState } from '../../utils/runtimeSetup'

export default defineEventHandler(() => {
  return getRuntimeSetupState()
})
