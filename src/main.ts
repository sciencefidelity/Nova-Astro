import { dependencyManagement } from "nova-extension-utils"


nova.commands.register("sciencefidelity.astro.reload", reload)

dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
)

let client: LanguageClient | null = null

let compositeDisposable = new CompositeDisposable()

// TODO: is this needed?
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
          },
        },
      }
    )
  } catch (err) {
    console.log("Failed to install")
    throw err
  }

  const runFile = nova.path.join(nova.extension.path, "run.sh")

  // Uploading to the extension library makes this file not executable
  await makeFileExecutable(runFile)

  let serviceArgs
  if (nova.inDevMode() && nova.workspace.path) {
    const logDir = nova.path.join(nova.workspace.path, "logs")
    await new Promise<void>((resolve, reject) => {
      const p = new Process("/usr/bin/env", {
        args: ["mkdir", "-p", logDir],
      })
      p.onDidExit((status) => (status === 0 ? resolve() : reject()))
      p.start()
    })
    console.log("logging to", logDir)
    // passing inLog breaks some requests for an unknown reason
    // const inLog = nova.path.join(logDir, "languageServer-in.log");
    const outLog = nova.path.join(logDir, "lsp.log")
    serviceArgs = {
      path: "/usr/bin/env",
      // args: ["bash", "-c", `tee "${inLog}" | "${runFile}" | tee "${outLog}"`],
      args: ["bash", "-c", `"${runFile}" | tee "${outLog}"`],
    }
  } else {
    serviceArgs = {
      path: runFile,
    }
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

  // I think there's a in onDidStop's disposable, which is why this logic is necessary
  // let disposed = false

  // compositeDisposable.add(
  //   client?.onDidStop(err => {
  //     if (disposed && !err) {
  //       return
  //     }
  //     console.log("Stopped")

  //     let message = "Astro Language Server stopped unexpectedly"
  //     if (err) {
  //       message += `:\n\n${err.toString()}`
  //     } else {
  //       message += "."
  //     }
  //     message +=
  //       "\n\nPlease report this, along with any output in the Extension Console."
  //     nova.workspace.showActionPanel(
  //       message,
  //       {
  //         buttons: ["Restart", "Ignore"],
  //       },
  //       index => {
  //         if (index == 0) {
  //           nova.commands.invoke("sciencefidelity.astro.reload")
  //         }
  //       }
  //     )
  //   })
  // )

  // compositeDisposable.add({
  //   dispose() {
  //     disposed = true
  //   },
  // })

  client.start()
}

export function activate() {
  console.log("activating...")
  // if (nova.inDevMode()) {
  //   const notification = new NotificationRequest("activated")
  //   notification.body = "Astro extension is loading"
  //   nova.notifications.add(notification)
  // }
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
