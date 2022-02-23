export function wrapCommand(
  // eslint-disable-next-line no-unused-vars
  command: (...args: any[]) => void | Promise<void>
  // eslint-disable-next-line no-unused-vars
): (...args: any[]) => void {
  return async function wrapped(...args: any[]) {
    try {
      await command(...args)
    } catch (err) {
      nova.workspace.showErrorMessage("command not implemented")
    }
  }
}
