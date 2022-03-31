import { dependencyManagement } from "nova-extension-utils"
import { AstroColorAssistant } from "./colors"
import { ClientOptions } from "./interfaces"
import { makeFileExecutable, wrapCommand } from "./utils"

const Colors = new AstroColorAssistant()
let client: LanguageClient | null = null
let compositeDisposable = new CompositeDisposable()
const runFile = nova.path.join(nova.extension.path, "run.sh")
let WORKSPACE_DIR: string
if (nova.inDevMode() && nova.workspace.path) {
  WORKSPACE_DIR = nova.path.join(nova.workspace.path, "test-workspace") ?? ""
} else {
  WORKSPACE_DIR = nova.workspace.path ?? ""
}

nova.assistants.registerColorAssistant(["astro"], Colors)

nova.commands.register(
  "sciencefidelity.astro.openWorkspaceConfig",
  wrapCommand(function openWorkspaceConfig(workspace: Workspace) {
    workspace.openConfig()
  })
)

nova.commands.register("sciencefidelity.astro.reload", restartClient)

dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
)

async function activateClient() {
  const serverOptions: ServerOptions = {
    type: "stdio",
    path: runFile,
    env: {
      WORKSPACE_DIR,
      INSTALL_DIR: dependencyManagement.getDependencyDirectory(),
    }
  }
  const clientOptions: ClientOptions = {
    syntaxes: ["astro"],
    initializationOptions: {
      configuration: {
        astro: {},
        prettier: {},
        emmet: {},
        typescript: {},
        javascript: {},
      },
      environment: "node",
      dontFilterIncompleteCompletions: true,
      isTrusted: true
    }
  }
  client = new LanguageClient(
    "sciencefidelity.astro",
    "Astro Language Server",
    serverOptions,
    clientOptions
  )

  let disposed = false
  compositeDisposable.add(
    client?.onDidStop(err => {
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
        index => {
          if (index == 0) {
            nova.commands.invoke("sciencefidelity.astro.reload")
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

async function restartClient() {
  console.log("deactivating...")
  deactivateClient()
  console.log("reloading...")
  await activateClient()
}

async function deactivateClient() {
  console.log("deactivate")
  compositeDisposable.dispose()
  compositeDisposable = new CompositeDisposable()
  client?.stop()
  client = null
}

export async function activate() {
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

  await makeFileExecutable(runFile)

  nova.config.onDidChange("sciencefidelity.astro.config.enableLsp", () => {
    if (nova.config.get("sciencefidelity.astro.config.enableLsp", "boolean")) {
      activateClient()
    } else {
      deactivateClient()
    }
  })

  if (nova.config.get("sciencefidelity.astro.config.enableLsp", "boolean")) {
    console.log("activating...")
    return activateClient()
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
    return deactivateClient()
  }
}
