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

  // const serverOptions = {
  //   args: "--stdio",
  //   path: `${dependencyManagement.getDependencyDirectory()}/node_modules/@astrojs/language-server/bin/nodeServer.js`,
  //   type: "stdio",
  // }
  // const syntaxes = ["astro"]
  // const env = {
  //   WORKSPACE_DIR: nova.workspace.path ?? "",
  //   INSTALL_DIR: dependencyManagement.getDependencyDirectory(),
  // }

  client = new LanguageClient(
    "sciencefidelity.astro",
    "Astro Language Server",
    {
      args: ["--stdio"],
      path: `${dependencyManagement.getDependencyDirectory()}/node_modules/@astrojs/language-server/bin/nodeServer.js`,
      type: "stdio",
    },
    {
      syntaxes: ["astro"]
    }
  )
  client?.start()
}

const activate = (): void | Promise<void> => {
  if (nova.config.get("sciencefidelity.astro.config.enableLsp", "boolean")) {
    console.log("activating...")
    compositeDisposable = new CompositeDisposable()
    return asyncActivate()
      .catch(err => {
        console.error("Failed to activate")
        console.error(err)
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
