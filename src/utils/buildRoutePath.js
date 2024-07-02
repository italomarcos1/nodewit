export function buildRoutePath(path) {
  // Expressão regular para capturar parâmetros de rota que são UUIDs
  const routeParametersRegex = /:([a-zA-Z]+)/g;

  // Substitui os parâmetros de rota pelo regex que captura UUIDs
  const paramsWithParams = path.replaceAll(routeParametersRegex, '(?<$1>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})');

  // Cria a expressão regular final para a rota
  const pathRegex = new RegExp(`^${paramsWithParams}$`);

  return pathRegex;
}
