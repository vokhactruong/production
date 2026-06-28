import { api } from "../../../lib/api-client";

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteImage: (publicId: string) => api.delete("/upload/image", { data: { publicId } }),
};
