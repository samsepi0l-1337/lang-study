export async function executeAgainst(run, query, variables) {
  const result = await run(query, variables);
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    const failure = new Error(result.errors.map((error) => error.message).join("\n"));
    failure.errors = result.errors;
    throw failure;
  }
  return result.data;
}

export function normalize(languages) {
  const byId = Object.create(null);
  for (const language of languages) {
    byId[language.id] = language;
  }
  return byId;
}
