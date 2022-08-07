import { dependencyManagement } from "nova-extension-utils";
import { AstroColorAssistant } from "./colors";
import { ClientOptions } from "./interfaces";
import { makeFileExecutable } from "./utils";

const Colors = new AstroColorAssistant();
let compositeDisposable = new CompositeDisposable();
let client: LanguageClient | null = null;

nova.assistants.registerColorAssistant(["astro"], Colors);
nova.commands.register("sciencefidelity.astro.reload", restartClient);
dependencyManagement.registerDependencyUnlockCommand(
  "sciencefidelity.astro.forceClearLock"
);

nova.config.onDidChange(
  "sciencefidelity.astro.config.enableLsp",
  async (current, _previous) => {
    if (current) {
      await activateClient();
    } else {
      await deactivateClient();
    }
  }
);

async function disposeSubscriptions() {
  compositeDisposable.dispose();
  compositeDisposable = new CompositeDisposable();
}

async function stopClient() {
  client?.stop();
}

async function activateClient() {
  try {
    await dependencyManagement.installWrappedDependencies(nova.subscriptions, {
      console: {
        log: (...args: Array<unknown>) => {
          console.log("dependencyManagement:", ...args);
        },
        info: (...args: Array<unknown>) => {
          console.info("dependencyManagement:", ...args);
        },
        warn: (...args: Array<unknown>) => {
          console.warn("dependencyManagement:", ...args);
        },
      },
    });
  } catch (err) {
    console.log("failed to install");
    throw err;
  }

  const runFile = nova.path.join(nova.extension.path, "run.sh");
  await makeFileExecutable(runFile);

  const serverOptions: ServerOptions = {
    type: "stdio",
    path: runFile,
    env: {
      WORKSPACE_DIR: nova.workspace.path ?? "",
      INSTALL_DIR: dependencyManagement.getDependencyDirectory(),
    },
  };
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
      isTrusted: true,
    },
  };
  client = new LanguageClient(
    "sciencefidelity.astro",
    "Astro Language Server",
    serverOptions,
    clientOptions
  );

  let disposed = false;
  compositeDisposable.add(
    client?.onDidStop((err) => {
      if (disposed && !err) {
        return;
      }
      let message = "Astro Language Server stopped unexpectedly";
      if (err) {
        message += `:\n\n${err.toString()}`;
      } else {
        message += ".";
      }
      message +=
        "\n\nPlease report this with any output in the Extension Console.";
      nova.workspace.showActionPanel(
        message,
        {
          buttons: ["Restart", "Ignore"],
        },
        (index) => {
          if (index == 0) {
            nova.commands.invoke("sciencefidelity.astro.reload");
          }
        }
      );
    })
  );
  compositeDisposable.add({
    dispose() {
      disposed = true;
    },
  });

  client?.start();
}

let restartingClient = false;
async function restartClient() {
  if (restartingClient) {
    return;
  }
  restartingClient = true;
  await deactivateClient();
  console.log("reloading...");
  await activate();
  console.log("activated");
  restartingClient = false;
}

let deactivatingClient = false;
async function deactivateClient() {
  if (deactivatingClient) {
    return;
  }
  deactivatingClient = true;
  console.log("deactivating...");
  await disposeSubscriptions();
  await stopClient();
  console.log("deactivated");
  deactivatingClient = false;
}

export async function activate() {
  if (nova.config.get("sciencefidelity.astro.config.enableLsp", "boolean")) {
    console.log("activating...");
    return activateClient()
      .catch((err) => {
        console.error("Failed to activate");
        console.error(err);
        nova.workspace.showErrorMessage(err);
      })
      .then(() => {
        console.log("activated");
      });
  } else {
    console.log("LSP disabled");
  }
}
