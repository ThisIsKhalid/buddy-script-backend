import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { getPublicImageUrl } from "../../../helpers/file_uploader/publicImageUrl";

const uploadImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "No image file provided.",
    });
  }

  const imageUrl = getPublicImageUrl(req.file.filename);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Image uploaded successfully.",
    data: { imageUrl },
  });
});

export const UploadController = { uploadImage };
