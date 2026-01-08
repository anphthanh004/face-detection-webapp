import {getAdminExist, getUploadVideo, 
  acceptVideo,deleteVideo, getWaitingVideo, addEmbeddings, 
  increaseUserBalance, deleteEmbedding } from '../model/adminModel.model.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from "fs/promises";
import { spawnPython } from "../utils/spawnPython.js";
import { fileURLToPath } from 'url'; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { sequelize } from '../postgres/postgres.js';
await sequelize.sync({ alter: true });

export const Login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Login failed: Missing username or password');
        return res.status(400).json({ message: 'username and password are required' });
    }

    try {
        const admin = await getAdminExist(username);
        console.log(admin);
        if (!admin) {
            console.log('Login failed: admin not found');
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        console.log('Login successful');
        return res.status(200).json({
            message: 'Login successful',
            admin: { username: admin.username },
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


export const AcceptVideo = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    console.log('Request failed: Missing user_id query parameter');
    return res.status(400).json({ message: 'User ID is required in query parameters' });
  }

  try {
    const result = await acceptVideo(user_id);
    console.log(`Upload status deleted for phone: ${user_id}`);
    return res.status(200).json({
      message: result.message,
      newVideoUrl: result.newVideoUrl,
    });
  } catch (error) {
    console.error('Error deleting upload status:', error);
    return res.status(500).json({ message: `Failed to delete upload status: ${error.message}` });
  }
};



export const DeleteVideo = async (req, res) => {
  const { user_id: phone } = req.query;
  if (!phone) {
    console.log('Request failed: Missing phone query parameter');
    return res.status(400).json({ message: 'Phone number is required in query parameters' });
  }
  try {
    const result = await deleteVideo(phone);
    console.log(`Video deleted for phone: ${phone}`);
    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({ message: `Failed to delete video: ${error.message}` });
  }
};

export const GetWaitingVideo = async (req, res) => {
  try {
    const waiting_list = await getWaitingVideo();
    
    if (!waiting_list) {
      return res.status(404).json({ message: "No  waiting status found" });
    }

    return res.status(200).json({ data: waiting_list });
  } catch (error) {
    console.error("Error in GetWaitingVideo controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const DownloadVideos = (req, res) => {
    const UserIds = req.body.ids;
    if (!Array.isArray(UserIds)) {
        return res.status(400).json({ error: "ids must be an array" });
    }

    const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');
    const pythonProcess = spawn('python', [
        pythonScriptPath,
        '--type', 'download_videos',
        '--ids', JSON.stringify(UserIds)
    ]);
    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.json({ message: 'Videos downloaded successfully' });
        } else {
            res.status(500).json({ error: 'Failed to run Python script' });
        }
    });
};

export const ExtractFaces = async (req, res) => {
    const userIds = req.body.ids;
    if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "ids must be an array" });
    }
    const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');

    const runExtractForId = (id) => {
        return new Promise((resolve, reject) => {
            const process = spawn('python', [
                pythonScriptPath,
                '--type', 'extract_faces',
                '--name', id 
            ]);
            process.stdout.on('data', (data) => {
                console.log(`[${id}] stdout: ${data}`);
            });
            process.stderr.on('data', (data) => {
                console.error(`[${id}] stderr: ${data}`);
            });
            process.on('close', (code) => {
                if (code === 0) {
                    console.log(`[${id}] Face extraction completed.`);
                    resolve();
                } else {
                    reject(`[${id}] Python script failed with code ${code}`);
                }
            });
        });
    };
    try {
        for (const id of userIds) {
            await runExtractForId(id);
        }
        res.json({ message: "Face extraction completed successfully for all IDs." });
    } catch (err) {
        res.status(500).json({ error: `Error during extraction process: ${err}` });
    }
};


export const AddPerson = async (req, res) => {
    const userIds = req.body.ids;
    if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "ids must be an array" });
    }
    const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');
    const runAddPerson = (id) => {
        return new Promise((resolve, reject) => {
            const process = spawn('python', [
                pythonScriptPath,
                '--type', 'add_person',
                '--name', id
            ]);
            process.stdout.on('data', (data) => {
                console.log(`[${id}] stdout: ${data}`);
            });
            process.stderr.on('data', (data) => {
                console.error(`[${id}] stderr: ${data}`);
            });
            process.on('close', (code) => {
                if (code === 0) {
                    console.log(`[${id}] Person added successfully.`);
                    resolve();
                } else {
                    reject(`[${id}] Python script failed with code ${code}`);
                }
            });
        });
    };

    try {
        for (const id of userIds) {
            await runAddPerson(id);
        }
        res.json({ message: `Added successfully for all IDs.` });
    } catch (err) {
        res.status(500).json({ error: `Error during add person process: ${err}` });
    }
};


// Khi Node.js gọi spawn, thư mục làm việc hiện tại của process Python mặc định là thư mục nơi Node.js được chạy, tức là thư mục gốc của ứng dụng Node.js (D:\project_2\web\server).
// Do đó, khi run.py chạy, thư mục làm việc hiện tại là D:\project_2\web\server, và np.save("embeddings.npy", ...) lưu file vào D:\project_2\web\server\mbeddings.npy.

export const AddEmbeddings = async (req, res) => {
  const ids = req.body.ids;
  const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');
  const process = spawn('python', [
                pythonScriptPath,
                '--type', 'export_embeddings',
            ]);
  let output = '';
  let errorOutput = '';
  process.stdout.on('data', (data) => {
    output += data.toString();
  });

  process.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });
  process.on('close', async (code) => {
    if (code !== 0) {
      return res.status(500).json({ success: false, message: `Python error: ${errorOutput}` });
    }
    try {
      const allEmbeddings = JSON.parse(output);
      const filteredEmbeddings = ids
        .filter((id) => allEmbeddings[id]) //Lọc ra những id có tồn tại trong allEmbeddings
        .map((id) => ({
          phone: id,
          embedding: allEmbeddings[id]
        }));

      if (filteredEmbeddings.length === 0) {
        return res.status(404).json({ success: false, message: "No embeddings found for given ids" });
      }
      const result = await addEmbeddings(filteredEmbeddings);
      return res.status(200).json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Failed to parse or update embeddings", error: err.message });
    }
  });
};



export const DeletePerson = async (req, res) => {
    const { user_id: phone } = req.query;

    if (!phone) {
        return res.status(400).json({ error: "Missing 'user_id' in query." });
    }
    const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');
      const process = spawn('python', [
          pythonScriptPath,
          '--type', 'delete_person',
          '--name', phone
      ]);

      process.stdout.on('data', (data) => {
          console.log(`[Python stdout] ${data}`);
      });

      process.stderr.on('data', (data) => {
          console.error(`[Python stderr] ${data}`);
      });

      process.on('close', (code) => {
          if (code === 0) {
              res.json({ message: `Successfully deleted user ${phone}.` });
          } else {
            res.status(500).json({ error: err });
          }
      });
};


export const DeleteEmbedding = async (req, res) => {
  const { user_id: phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: "Missing 'user_id' in query." });
  }
  try {
    const user = await deleteEmbedding(phone);
    if (!user) {
      return res.status(404).json({ error: `User with phone ${phone} not found.` });
    }
    res.json({ message: `Embedding deleted for ${phone}.`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const FindClosest = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Vui lòng cung cấp ảnh." });
  }
  const imagePath = req.file.path;
  const embeddings = req.body.embeddings
  const pythonScriptPath = path.join(__dirname, '..', '..', '..', 'python-process', 'run.py');
  if (!embeddings) {
    await fs.unlink(imagePath);
    return res.status(400).json({ error: "Vui lòng cung cấp từ điển embedding." });
  }
  try {
    const { stdoutData, stderrData, code } = await spawnPython(
      [
        pythonScriptPath,
        "--type",
        "find_closest_person",
        "--test_image",
        imagePath,
      ],
      embeddings
    );
    await fs.unlink(imagePath);
    if (code !== 0) {
      return res.status(500).json({ error: `Python error: ${stderrData}` });
    }
    const lines = stdoutData.split("\n");
    let closestPerson = null;
    let distance = null;

    for (const line of lines) {
      if (line.startsWith("Closest match:")) {
        const match = line.match(/Closest match: (\S+) with distance (\S+)/);
        if (match) {
          closestPerson = match[1];
          distance = parseFloat(match[2]);
        }
      } else if (line.includes("No match found")) {
        return res.status(200).json({ closest_person: null, distance: null });
      }
    }

    if (closestPerson) {
      res.status(200).json({ closest_person: closestPerson, distance });
    } else {
      res.status(200).json({ closest_person: null, distance: null });
    }
  } catch (err) {
    if (await fs.exists(imagePath)) {
      await fs.unlink(imagePath);
    }
    res.status(500).json({ error: err.message });
  }
};




export const IncreaseUserBalance = async (req, res) => {
  const { user_id: phone } = req.query;
  const {amount} = req.body;

  if (!phone || typeof amount !== 'number' || isNaN(amount)) {
    console.log("IncreaseUserBalance failed: Missing or invalid phone/amount");
    return res.status(400).json({ message: "Valid phone and amount are required" });
  }
  const transaction = await sequelize.transaction();
  try {
    const user = await increaseUserBalance(phone, amount, transaction);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    await transaction.commit();
    console.log(`Balance increased: phone=${phone}, newBalance=${user.balance}`);
    return res.status(200).json({ message: "Balance updated successfully", balance: user.balance });
  } catch (error) {
    await transaction.rollback();
    console.error("Error increasing user balance:", error);
    return res.status(500).json({ message: "Failed to increase user balance" });
  }
};



