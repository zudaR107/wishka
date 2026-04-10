type DatabaseEnv = {
  databaseUrl: string;
  databaseSsl: boolean;
};

function parseBoolean(value: string | undefined) {
  return value === "true" || value === "1" || value === "yes";
}

export function getDatabaseEnv(): DatabaseEnv {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return {
    databaseUrl,
    databaseSsl: parseBoolean(process.env.DATABASE_SSL),
  };
}
