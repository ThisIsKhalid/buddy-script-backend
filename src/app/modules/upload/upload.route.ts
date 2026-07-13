import express from "express";
import auth from "../../middlewares/auth";
import { imageUploader } from "../../../helpers/file_uploader/imageUploader";
import { UploadController } from "./upload.controller";

const router = express.Router();

/**
 * POST /api/v1/uploader/image
 * Requires auth. Accepts a single image file (field name: "image").
 * Returns: { imageUrl: "http://localhost:8000/uploads/images/..." }
 */
router.post(
  "/image",
  auth(),
  imageUploader.single("image"),
  UploadController.uploadImage
);

export const UploadRoutes = router;
