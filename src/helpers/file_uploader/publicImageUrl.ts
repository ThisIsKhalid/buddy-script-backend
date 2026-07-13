import config from "../../config";

export function getPublicImageUrl(filename: string): string {
  const baseUrl = config.app.backendUrl || `http://localhost:${config.port}`;
  return `${baseUrl}/uploads/images/${filename}`;
}
