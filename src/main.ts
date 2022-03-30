import { AstroColorAssistant } from "./colors"
import { dependencyManagement } from "nova-extension-utils"
import { wrapCommand } from "./novaUtils"

const Colors = new AstroColorAssistant()
nova.assistants.registerColorAssistant(["astro"], Colors)

let client: LanguageClient | null = null
let compositeDisposable = new CompositeDisposable()

const makeFileExecutable = async (file: string) => {
  return new Promise<void>((resolve, reject) => {
    const process = new Process("/usr/bin/env", {
      args: ["chmod", "u+x", file],
    })
    process.onDidExit((status) => {
      if (status === 0) {
        resolve()
      } else {
        reject(status)
      }
    })
    process.start()
  })
}


const reload = async () => {
  console.log("deactivating...")
  deactivate()
  console.log("reloading...")
  await asyncActivate()
}

const asyncActivate = async () => {
  try {
    await dependencyManagement.installWrappedDependencies(
      compositeDisposable,
      {
        console: {
          log: (...args: Array<unknown>) => {
            console.log("dependencyManagement:", ...args)
          },
          info: (...args: Array<unknown>) => {
            console.info("dependencyManagement:", ...args)
          },
          warn: (...args: Array<unknown>) => {
            console.warn("dependencyManagement:", ...args)
          }
        }
      }
    )
  } catch (err) {
    console.log("Failed to install")
    throw err
  }

  const runFile = nova.path.join(nova.extension.path, "run.sh")
  await makeFileExecutable(runFile)

  let serviceArgs
  let WORKSPACE_DIR
  if (nova.inDevMode() && nova.workspace.path) {
    const logDir = nova.path.join(nova.workspace.path, "logs")
    await new Promise<void>((resolve, reject) => {
      const p = new Process("/usr/bin/env", {
        args: ["mkdir", "-p", logDir]
      })
      p.onDidExit((status) => (status === 0 ? resolve() : reject()))
      p.start()
    })
    console.log("logging to", logDir)
    // passing inLog breaks some requests for an unknown reason
    const inLog = nova.path.join(logDir, "languageServer-in.log")
    const outLog = nova.path.join(logDir, "languageServer-out.log")
    serviceArgs = {
      path: "/usr/bin/env",
      args: ["bash", "-c", `tee "${inLog}" | "${runFile}" | tee "${outLog}"`]
      // args: ["bash", "-c", `"${runFile}" | tee "${outLog}"`]
    }
    WORKSPACE_DIR = `${nova.workspace.path}/test-workspace` ?? ""
  } else {
    serviceArgs = {
      path: runFile
    }
    WORKSPACE_DIR = nova.workspace.path ?? ""
  }

  const syntaxes = ["astro"]
  const env = {
    WORKSPACE_DIR,
    INSTALL_DIR: dependencyManagement.getDependencyDirectory(),
  }

  client = new LanguageClient(
    "sciencefidelity.astro",
    "Astro Language Server",
    {
      type: "stdio",
      ...serviceArgs,
      env
    },
    {
      syntaxes
    }
  )

  let disposed = false

  compositeDisposable.add(
    client?.onDidStop((err) => {
      if (disposed && !err) {
        return
      }
      let message = "Astro Language Server stopped unexpectedly"
      if (err) {
        message += `:\n\n${err.toString()}`
      } else {
        message += "."
      }
      message +=
        "\n\nPlease report this with any output in the Extension Console."
      nova.workspace.showActionPanel(
        message,
        {
          buttons: ["Restart", "Ignore"]
        },
        (index) => {
          if (index == 0) {
            nova.commands.invoke("apexskier.typescript.reload")
          }
        }
      )
    })
  )

  compositeDisposable.add({
    dispose() {
      disposed = true
    }
  })

  client.start()
}

export function activate() {
  if (nova.config.get("sciencefidelity.astro.config.enableLsp", "boolean")) {
    console.log("activating...")
    if (nova.inDevMode()) {
      const notification = new NotificationRequest("activated")
      notification.body = "Astro extension is loading"
      nova.notifications.add(notification)
    }
    return asyncActivate()
      .catch(err => {
        console.error("Failed to activate")
        console.error(err)
        nova.workspace.showErrorMessage(err)
      })
      .then(() => {
        console.log("activated")
      })
  } else {
    console.log("LSP disabled...")
    return deactivate()
  }
}

const deactivate = (): void | Promise<void> => {
  console.log("deactivate")
  compositeDisposable.dispose()
  compositeDisposable = new CompositeDisposable()
  client?.stop()
}

nova.commands.register(
  "sciencefidelity.astro.openWorkspaceConfig",
  wrapCommand(function openWorkspaceConfig(workspace: Workspace) {
    workspace.openConfig()
  })
)

nova.commands.register("sciencefidelity.astro.reload", reload)

dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
)

nova.config.onDidChange("sciencefidelity.astro.config.enableLsp", () => {
  client ? deactivate() : activate()
})
