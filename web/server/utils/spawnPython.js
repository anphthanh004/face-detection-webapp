import { spawn } from "child_process";

export const spawnPython = (args, inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", args);

    let stdoutData = "";
    let stderrData = "";
    if (inputData) {
      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();
    }

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      resolve({ stdoutData, stderrData, code });
    });

    pythonProcess.on("error", (err) => {
      reject(err);
    });
  });
};