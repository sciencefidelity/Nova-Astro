import { dependencyManagement } from "nova-extension-utils"

nova.commands.register("sciencefidelity.astro.reload", reload)

dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
)

let client: LanguageClient | null = null
let compositeDisposable = new CompositeDisposable()

async function makeFileExecutable(file: string) {
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


async function reload() {
  deactivate()
  console.log("reloading...")
  await asyncActivate()
}

async function asyncActivate() {
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

  const serviceArgs = {
    path: runFile,
  }
  const syntaxes = ["astro"]
  const env = {
    WORKSPACE_DIR: nova.workspace.path ?? "",
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
  client.start()
}

export function activate() {
  console.log("activating...")
  return asyncActivate()
    .catch(err => {
      console.error("Failed to activate")
      console.error(err)
      nova.workspace.showErrorMessage(err)
    })
    .then(() => {
      console.log("activated")
    })
}

export function deactivate() {
  console.log("deactivate")
  compositeDisposable.dispose()
  compositeDisposable = new CompositeDisposable()
  client?.stop()
}
