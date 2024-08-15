import { $, file, argv } from "bun";
import { readdir } from "fs/promises";
import { join } from "path";
import ps from "ps-node";

// Global variables
const folder_name = "os-status-page";
const LOCK_FILE = "process.lock";

// Color codes
const RED = "\x1b[0;31m";
const GREEN = "\x1b[0;32m";
const YELLOW = "\x1b[1;33m";
const BLUE = "\x1b[0;34m";
const NC = "\x1b[0m"; // No Color

const menu_options: Record<number, [string, () => Promise<void>]> = {
  1: ["Install", install_process],
  2: ["Start", start_process],
  3: ["Start with Docker", start_with_docker],
  4: ["Stop", stop_process],
  5: ["Upgrade", upgrade_process],
  6: ["Logs", show_logs],
  7: ["Exit", exit_script],
};

async function doesFolderExist(folderName) {
  const folderPath = join(__dirname, folderName);

  try {
    await readdir(folderPath);
    return true; // Directory exists
  } catch (err) {
    if (err.code === "ENOENT") {
      return false; // Directory does not exist
    }
    throw err; // Re-throw unexpected errors
  }
}

// Function to download the latest release
async function download_latest_release() {
  await animate_loading("Fetching latest release", 2);
  const response = await fetch(
    "https://api.github.com/repos/tommy141x/os-status-page/releases/latest",
  );
  const data = await response.json();
  const tarball_url = data.tarball_url;
  console.log(`${BLUE}🔗 Tarball URL:${NC} ${tarball_url}`);

  const output_file = "latest-release.tar.gz";
  const output_dir = folder_name;

  await animate_loading("Downloading tarball", 2);
  await $`curl -L -o ${output_file} ${tarball_url}`;
  console.log(`${GREEN}✅ Download complete:${NC} ${output_file}`);

  await $`mkdir -p ${output_dir}`;
  await animate_loading("Extracting tarball", 2);
  await $`tar -xzf ${output_file} -C ${output_dir}`;

  // Node.js method to find the extracted directory
  const directories = await readdir(output_dir, { withFileTypes: true });
  const extracted_dir = directories.find((dirent) =>
    dirent.isDirectory(),
  )?.name;

  if (extracted_dir) {
    await $`mv ${join(output_dir, extracted_dir)}/* ${output_dir}`;
    await $`rm -rf ${join(output_dir, extracted_dir)}`;
    console.log(`${GREEN}📦 Moved contents to:${NC} ${output_dir}`);
  } else {
    console.log(`${YELLOW}⚠️ No directory found to move.${NC}`);
  }

  console.log(`${GREEN}✅ Extraction and cleanup complete.${NC}`);
  await $`rm ${output_file}`;
  console.log(`${GREEN}🧹 Cleanup complete.${NC}`);
}

async function install_process() {
  console.clear();
  await animate_loading("Installing", 2);

  // Download and extract the latest release
  await download_latest_release();

  // Check if Bun is already installed
  /*if (!((await $`command -v bun`.exitCode) === 0)) {
    await animate_loading("Bun not found. Installing Bun", 2);
    await $`curl -fsSL https://bun.sh/install | bash`;
  } else {
    console.log(`${GREEN}✅ Bun is already installed.${NC}`);
    }*/

  // Change directory to the extracted folder
  process.chdir(folder_name);
  // Install dependencies with Bun
  await $`bun install`;

  // Print completion message
  console.log(`${GREEN}✅ Installation complete!${NC}`);
  console.log(
    `${YELLOW}⚠️ Please rename and modify the config file from config.example.yml to config.yml${NC}`,
  );
  process.chdir("..");
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

async function upgrade_process() {
  console.clear();
  await animate_loading("Stopping processes", 2);
  await stop_process();
  console.clear();
  await animate_loading("Upgrading", 2);

  // Check if directory exists
  if (!(await doesFolderExist(folder_name))) {
    console.log(
      `${RED}⚠️ Directory ${folder_name} does not exist. Cannot upgrade.${NC}`,
    );
    return;
  }

  // Backup configuration and database
  if (await file(`${folder_name}/config.yml`).exists())
    await $`mv ${folder_name}/config.yml config.yml.bak`;
  if (await file(`${folder_name}/public/logo.png`).exists())
    await $`mv ${folder_name}/public/logo.png logo.png.bak`;
  if (await file(`${folder_name}/statusdb.sqlite`).exists())
    await $`mv ${folder_name}/statusdb.sqlite statusdb.sqlite.bak`;
  if (await file(`${folder_name}/docker-compose.yml`).exists())
    await $`mv ${folder_name}/docker-compose.yml docker-compose.yml.bak`;

  // Remove the old application folder
  await $`rm -rf ${folder_name}`;

  // Download and extract the latest release
  await download_latest_release();

  // Restore the configuration and database
  if (file("config.yml.bak").exists())
    await $`mv config.yml.bak ${folder_name}/config.yml.old`;
  if (file("logo.png.bak").exists())
    await $`mv logo.png.bak ${folder_name}/public/logo.png`;
  if (file("docker-compose.yml.bak").exists())
    await $`mv docker-compose.yml.bak ${folder_name}/docker-compose.yml.old`;
  if (file("statusdb.sqlite.bak").exists())
    await $`mv statusdb.sqlite.bak ${folder_name}/statusdb.sqlite`;
  if (await file(`${folder_name}/scripts/setup.sh`).exists())
    await $`mv ${folder_name}/scripts/setup.sh setup.sh`;
  await $`chmod +x setup.sh`;

  // Change directory to the extracted folder
  process.chdir(folder_name);
  // Install dependencies with Bun
  await $`bun install`;

  // Print completion message
  console.log(
    `${YELLOW}⚠️ Please check and update your config file if necessary. Old config file is saved as config.yml.old${NC}`,
  );
  console.log(`${GREEN}✅ Upgrade complete!${NC}`);
  process.chdir("..");
  await new Promise((resolve) => setTimeout(resolve, 3000));
  process.exit(0);
}

async function start_process() {
  console.clear();
  await animate_loading("Starting", 2);

  // Check if directory exists
  if (!(await doesFolderExist(folder_name))) {
    console.log(
      `${RED}⚠️ Directory ${folder_name} does not exist. Cannot start.${NC}`,
    );
    return;
  }

  // Check if config.yml exists
  if (!(await file(`${folder_name}/config.yml`).exists())) {
    console.log(`${RED}⚠️ config.yml not found. Cannot start.${NC}`);
    return;
  }

  // Backup configuration and database
  if (await file(`${folder_name}/config.yml`).exists())
    await $`cp ${folder_name}/config.yml ${folder_name}/config.yml.bak`;
  if (await file(`${folder_name}/statusdb.sqlite`).exists())
    await $`cp ${folder_name}/statusdb.sqlite ${folder_name}/statusdb.sqlite.bak`;

  process.chdir(folder_name);

  // Start the application and capture output
  const proc = Bun.spawn(["bun", "start"], { stdout: "pipe", stderr: "pipe" });
  proc.unref();

  const process_pid = proc.pid;
  console.log("Process ID: " + process_pid);
  await animate_loading("Waiting for API to be ready", 2);

  // Save the PID to the lock file
  await Bun.write(LOCK_FILE, process_pid.toString());

  // Initialize timer and interval variables
  const timeout = 30;
  const interval = 1;
  let elapsed = 0;

  // Check for success indicators in the latest.log file
  while (elapsed < timeout) {
    if (await file("latest.log").exists()) {
      const logContent = await file("latest.log").text();
      if (logContent.includes("http")) {
        console.log(`${GREEN}✅ Application started!${NC}`);
        break;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    elapsed += interval;
  }

  if (elapsed >= timeout) {
    console.log(`${RED}⚠️ Failed to start application.${NC}`);
    proc.kill();
    await $`rm ${LOCK_FILE}`;
  }

  process.chdir("..");
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

async function start_with_docker() {
  console.clear();
  await animate_loading("Starting with Docker", 2);

  // Backup configuration and database
  if (await file(`${folder_name}/config.yml`).exists())
    await $`cp ${folder_name}/config.yml ${folder_name}/config.yml.bak`;
  if (await file(`${folder_name}/statusdb.sqlite`).exists())
    await $`cp ${folder_name}/statusdb.sqlite ${folder_name}/statusdb.sqlite.bak`;

  // Check if config.yml exists
  if (!(await file(`${folder_name}/config.yml`).exists())) {
    console.log(`${RED}⚠️ config.yml not found. Cannot start.${NC}`);
    return;
  }

  // Check if Docker is installed
  if (!((await $`command -v docker`.exitCode) === 0)) {
    const install_docker = await new Promise((resolve) => {
      console.log(
        "Docker is not installed. Would you like to install it? (y/n): ",
      );
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim().toLowerCase());
      });
    });

    if (install_docker === "y") {
      await animate_loading("Installing Docker", 2);
      await $`curl -fsSL https://get.docker.com | sh`;
    } else {
      console.log(
        `${RED}⚠️ Docker is required to start the application with Docker.`,
      );
      return;
    }
  }

  process.chdir(folder_name);

  // Start the application with Docker and redirect output to the log file
  const proc = Bun.spawn(["docker", "compose", "up"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const logFile = Bun.file("latest.log");
  const writer = logFile.writer();

  proc.stdout.pipeTo(writer);
  proc.stderr.pipeTo(writer);

  const docker_pid = proc.pid;

  // Save the Docker PID to the lock file
  await Bun.write(LOCK_FILE, docker_pid.toString());
  await $`echo "Docker PID: ${docker_pid}" >> latest.log`;

  await animate_loading("Waiting for API to be ready", 2);

  // Initialize timer and interval variables
  const timeout = 30;
  const interval = 1;
  let elapsed = 0;

  // Check for success indicators in the log file
  while (elapsed < timeout) {
    const logContent = await Bun.file("latest.log").text();
    if (logContent.includes("http")) {
      console.log(`${GREEN}✅ Application started with Docker!`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    elapsed += interval;
  }

  if (elapsed >= timeout) {
    const error_message = await Bun.file("latest.log").text();
    console.log(
      `${YELLOW}⚠️ Failed to start application with Docker. Error: ${error_message}`,
    );
    await $`docker compose down`;
    await $`rm ${LOCK_FILE}`;
  }

  process.chdir("..");
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

async function stop_process() {
  console.clear();
  await animate_loading("Stopping", 2);

  try {
    // Check if Docker is installed
    const dockerCommand = await fs
      .access("docker", fs.constants.X_OK)
      .then(() => true)
      .catch(() => false);
    if (dockerCommand) {
      // Docker is installed
      process.chdir(folder_name);
      await fs.writeFile("docker-compose.yml", ""); // Ensure that the Docker Compose file is present for testing purposes
      await $`docker compose down`;
      process.chdir("..");
    } else {
      // Docker is not installed
      console.log("Docker not found, skipping Docker stop...");
    }

    // Check if lock file exists
    try {
      await fs.access(`${folder_name}/${LOCK_FILE}`);
      const process_pid = await fs.readFile(
        `${folder_name}/${LOCK_FILE}`,
        "utf8",
      );

      if (process_pid) {
        // Check if the process is running
        ps.lookup(
          { pid: parseInt(process_pid, 10) },
          async (err, resultList) => {
            if (err) {
              throw new Error(err);
            }

            if (resultList.length > 0 && resultList[0].stat === "R") {
              await fs.unlink(`${folder_name}/${LOCK_FILE}`);
              process.kill(process_pid);
              console.log(
                `Process with PID ${process_pid} stopped and lock file removed.`,
              );
            } else {
              console.log(
                `Process with PID ${process_pid} not found. Removing stale lock file.`,
              );
              await fs.unlink(`${folder_name}/${LOCK_FILE}`);
            }
          },
        );
      } else {
        console.log("No PID found in the lock file.");
      }
    } catch {
      console.log("No lock file found.");
    }

    console.log("Application stopped!");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

async function animate_loading(message: string, duration: number) {
  const interval = 200; // 0.2 seconds
  let dots = "";
  let elapsed = 0;

  while (elapsed < duration * 1000) {
    process.stdout.write(`\r\x1b[K${message}${dots}`);
    await new Promise((resolve) => setTimeout(resolve, interval));
    dots += ".";
    elapsed += interval;
    if (dots.length >= 4) {
      dots = "";
    }
  }
  console.log();
}

async function show_logs() {
  console.clear();
  if (await file(`${folder_name}/latest.log`).exists()) {
    const logContent = await await file(`${folder_name}/latest.log`).text();
    console.log(logContent);
    await new Promise((resolve) => {
      console.log("Press any key to continue...");
      process.stdin.once("data", resolve);
    });
  } else {
    console.log("No logs available.");
    await new Promise((resolve) => {
      console.log("Press any key to continue...");
      process.stdin.once("data", resolve);
    });
  }
}

async function exit_script() {
  console.clear();
  console.log("Exiting...");
  process.exit(0);
}

async function get_local_version(): Promise<string> {
  const packageJsonPath = `${folder_name}/package.json`;
  if (file(packageJsonPath).exists()) {
    try {
      const packageJson = JSON.parse(await file(packageJsonPath).text());
      return packageJson.version || "N/A";
    } catch (error) {
      return "N/A";
    }
  }
  return "Not installed";
}

async function get_latest_version(): Promise<string> {
  const response = await fetch(
    "https://api.github.com/repos/tommy141x/os-status-page/releases/latest",
  );
  const data = await response.json();
  return data.name || "N/A";
}

function display_ascii() {
  console.log(`${NC}

  ______________  ________  _______    ____  ___   ____________
 / ___/_  __/   |/_  __/ / / / ___/   / __ \\/   | / ____/ ____/
 \\__ \\ / / / /| | / / / / / /\\__ \\   / /_/ / /| |/ / __/ __/
 ___/ // / / ___ |/ / / /_/ /___/ /  / ____/ ___ / /_/ / /___
 /____//_/ /_/  |_/_/  \\____//____/  /_/   /_/  |_\\____/_____/

 by ${BLUE}Tommy Johnston${NC}
   `);
}

async function process_option(key: number) {
  const action = menu_options[key][1];
  await action();
}

async function display_menu() {
  while (true) {
    console.clear();
    display_ascii();

    const local_version = await get_local_version();
    const latest_version = await get_latest_version();

    console.log("Welcome to the Setup Menu! 🚀");
    if (local_version === "N/A") {
      console.log(
        `Version: ${RED}Not installed${NC} (Latest: ${latest_version}) 🔴`,
      );
    } else if (local_version === latest_version) {
      console.log(`Version: ${BLUE}${local_version}${NC} (Latest) 🟢`);
    } else {
      console.log(
        `Version: ${BLUE}${local_version}${NC} (Update available: ${latest_version}) 🟡`,
      );
    }

    // Determine process status
    if (await file(`${folder_name}/${LOCK_FILE}`).exists()) {
      console.log(`Status: ${GREEN}Running (Healthy) 🟢${NC}`);
    } else {
      console.log(`Status: ${RED}Not Running (No Lock File) 🔴${NC}`);
    }

    console.log("Please choose an option:");
    const keys = Object.keys(menu_options)
      .map(Number)
      .sort((a, b) => a - b);
    for (const key of keys) {
      console.log(`[${key}] ${menu_options[key][0]}`);
    }

    // Handle user input
    await handle_input();

    // Short sleep to reduce CPU usage
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function handle_input() {
  const choice = await new Promise<string>((resolve) => {
    process.stdout.write(
      `Enter your choice [1-${Object.keys(menu_options).length}]: `,
    );
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim());
    });
  });

  const choiceNum = parseInt(choice);
  if (choiceNum >= 1 && choiceNum <= Object.keys(menu_options).length) {
    await process_option(choiceNum);
  } else {
    console.log("Invalid choice. Please try again.");
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Main script
async function main() {
  console.log("Entering main function");
  process.on("SIGINT", exit_script);

  while (true) {
    console.log("About to call display_menu");
    await display_menu();
    console.log("Finished display_menu call");
  }
}

main().catch((error) => {
  console.error("An error occurred in main():", error);
  process.exit(1);
});
