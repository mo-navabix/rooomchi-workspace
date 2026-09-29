import fs from "fs";
import path from "path";

export type AppVersionInfo = {
  name: string;
  version: string;
  nodeEnv: string;
};

export function getAppVersionInfo(): AppVersionInfo {
  let version = "0.0.0";
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version?: string; name?: string };
    version = pkg.version || version;
    return {
      name: pkg.name || "rooomchi",
      version,
      nodeEnv: process.env.NODE_ENV || "development",
    };
  } catch {
    return { name: "rooomchi", version, nodeEnv: process.env.NODE_ENV || "development" };
  }
}
