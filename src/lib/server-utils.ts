import yaml from "js-yaml";
import { promises as fs } from "fs";
import path from "path";

interface ServiceConfig {
  name: string;
  description: string;
  url: string;
  hide_url: boolean;
  expected_response_code: number;
}

interface Config {
  services: ServiceConfig[];
  data_retention_days: number;
  check_interval_seconds: number;
  secret: string;
}

export async function loadConfig(): Promise<Config> {
  try {
    // Adjust the path to your config file
    const configFilePath = path.resolve(process.cwd(), "config.yml");

    // Read the file content using fs.promises.readFile
    const configFileContent = await fs.readFile(configFilePath, "utf8");

    // Parse the YAML content
    const config = yaml.load(configFileContent) as Config;
    return config;
  } catch (error) {
    console.error("Error loading configuration:", error);
    return {} as Config;
  }
}
