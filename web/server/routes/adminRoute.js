import express from 'express'
import {Login, AcceptVideo, GetWaitingVideo, 
    DownloadVideos, ExtractFaces,AddPerson, AddEmbeddings, 
    FindClosest, IncreaseUserBalance,
    DeletePerson, DeleteEmbedding,DeleteVideo
} from '../controller/adminController.controller.js';

const adminRouter = express.Router()
import upload from '../middleware/multerConfig.js'

adminRouter.post("/login", Login);
adminRouter.delete("/accept-video", AcceptVideo);
adminRouter.get("/waiting-video", GetWaitingVideo);
adminRouter.post("/download-videos", DownloadVideos);
adminRouter.post("/extract-faces",ExtractFaces);
adminRouter.post("/add-to-embedding-file",AddPerson);
adminRouter.put("/put-embeddings",AddEmbeddings);
adminRouter.post("/find-closest",upload.single("file"),FindClosest);
// adminRouter.post("/find-closests",FindClosest2);
adminRouter.put("/increase-balance",IncreaseUserBalance)
adminRouter.delete("/delete-video",DeleteVideo)
adminRouter.delete("/delete-from-embedding-file",DeletePerson)
adminRouter.delete("/delete-embedding",DeleteEmbedding)
export default adminRouter;
