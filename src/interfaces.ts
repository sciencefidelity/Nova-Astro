export interface InitializationOptions {
  configuration: {
    astro: any;
    prettier: any;
    emmet: any;
    typescript: any;
    javascript: any;
  };
  environment: "browser" | "node";
  dontFilterIncompleteCompletions: boolean;
  isTrusted: boolean;
}

export interface ClientOptions {
  initializationOptions: InitializationOptions;
  syntaxes: string[];
}
