import { dependencyManagement } from "nova-extension-utils"

nova.commands.register("sciencefidelity.astro.reload", reload)

dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
)

let client: LanguageClient | null = null
let compositeDisposable = new CompositeDisposable()

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

  const path = `
    ${dependencyManagement.getDependencyDirectory()}
    /node_modules/.bin/astro-ls
  `
  client = new LanguageClient(
    "sciencefidelity.astro",
    "Astro Language Server",
    {
      args: ["node", "--stdio"],
      path,
      type: "stdio"
    },
    {
      syntaxes: ["astro"]
    }
  )
  client.start()
}

export async function activate() {
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
