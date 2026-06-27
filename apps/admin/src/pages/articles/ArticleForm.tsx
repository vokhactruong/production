import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ImageIcon, X } from "lucide-react";
import { articlesApi, categoriesApi, uploadApi, getData } from "../../api/client";
import { useToast } from "../../components/Toast";
import RichEditor from "../../components/editor/RichEditor";
import { cn } from "../../utils";
import type { Article, Category } from "../../types";
import slugify from "slugify";
import axios from "axios";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function ArticleForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { emitToast } = useToast();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailPublicId, setThumbnailPublicId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED">("DRAFT");

  // Track publicId của ảnh đã upload trong session này nhưng chưa commit vào DB
  const pendingPublicIdRef = useRef<string | null>(null);

  const slugPreview = title ? slugify(title, { lower: true, strict: true, locale: "vi" }) : "";

  const { data: articleData } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articlesApi.getAdminOne(id!),
    enabled: isEdit,
  });

  const { data: catsData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });
  const categories = catsData ? getData<Category[]>(catsData) : [];

  useEffect(() => {
    if (articleData) {
      const article = getData<Article>(articleData);
      setTitle(article.title);
      setExcerpt(article.excerpt ?? "");
      setContent(article.content);
      setThumbnail(article.thumbnail ?? "");
      setThumbnailPublicId(article.thumbnailPublicId ?? "");
      setCategoryId(article.categoryId ?? "");
      setTags(article.tags ?? []);
      setStatus(article.status);
    }
  }, [articleData]);

  // Cleanup: xóa ảnh orphan nếu user navigate away mà chưa lưu bài
  useEffect(() => {
    return () => {
      if (pendingPublicIdRef.current) {
        uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      }
    };
  }, []);

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIMES.includes(file.type)) {
      emitToast("Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF", "error");
      return;
    }
    if (file.size > MAX_SIZE) {
      emitToast("Ảnh không được vượt quá 5MB", "error");
      return;
    }

    // Xóa ảnh pending trước đó trong session này trước khi upload ảnh mới
    if (pendingPublicIdRef.current) {
      await uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      pendingPublicIdRef.current = null;
    }

    setIsUploading(true);
    try {
      const res = await uploadApi.image(file);
      const { url, publicId } = getData<{ url: string; publicId: string }>(res);
      setThumbnail(url);
      setThumbnailPublicId(publicId);
      pendingPublicIdRef.current = publicId;
    } catch {
      emitToast("Lỗi khi tải ảnh lên", "error");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveThumbnail = async () => {
    if (pendingPublicIdRef.current) {
      await uploadApi.deleteImage(pendingPublicIdRef.current).catch(() => {});
      pendingPublicIdRef.current = null;
    }
    setThumbnail("");
    setThumbnailPublicId("");
  };

  const saveMutation = useMutation({
    mutationFn: (s: typeof status) => {
      const payload = isEdit
        ? {
            title,
            excerpt: excerpt || undefined,
            content,
            thumbnail: thumbnail || null,
            thumbnailPublicId: thumbnailPublicId || null,
            categoryId: categoryId || undefined,
            tags,
            status: s,
          }
        : {
            title,
            excerpt: excerpt || undefined,
            content,
            thumbnail: thumbnail || undefined,
            thumbnailPublicId: thumbnailPublicId || undefined,
            categoryId: categoryId || undefined,
            tags,
            status: s,
          };
      return isEdit ? articlesApi.update(id!, payload) : articlesApi.create(payload);
    },
    onSuccess: () => {
      pendingPublicIdRef.current = null; // ảnh đã được commit vào DB
      emitToast(isEdit ? "Đã cập nhật bài viết" : "Đã tạo bài viết", "success");
      navigate("/articles");
    },
    onError: (err) => {
      emitToast(
        axios.isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ?? "Có lỗi")
          : "Có lỗi",
        "error"
      );
    },
  });

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim();
      if (t && !tags.includes(t) && tags.length < 10) {
        setTags([...tags, t]);
        setTagInput("");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
          </h2>
        </div>
        <button
          onClick={() => navigate("/articles")}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {slugPreview && (
                <p className="mt-1 text-xs text-slate-500">
                  Slug: <code>{slugPreview}</code>
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                <span>Tóm tắt</span>
                <span className="text-xs text-slate-400">{excerpt.length}/500</span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tóm tắt ngắn về bài viết..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nội dung *</label>
              <RichEditor
                value={content}
                onChange={setContent}
                placeholder="Bắt đầu viết nội dung..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900">Xuất bản</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">Nháp</option>
                <option value="REVIEW">Chờ duyệt</option>
                <option value="PUBLISHED">Xuất bản</option>
                <option value="ARCHIVED">Lưu trữ</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => saveMutation.mutate("DRAFT")}
                disabled={saveMutation.isPending || isUploading}
                className="h-10 w-full rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {saveMutation.isPending ? "Đang lưu..." : "Lưu nháp"}
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate(status)}
                disabled={saveMutation.isPending || isUploading}
                className="h-10 w-full rounded-xl bg-slate-800 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
              >
                Lưu
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => navigate(`/articles/${id}/preview`)}
                  className="h-10 w-full rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Xem trước
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900">Cài đặt</h3>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Danh mục</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Không có —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ảnh đại diện</label>
              {thumbnail ? (
                <div className="relative mt-1">
                  <img src={thumbnail} alt="" className="h-36 w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  className={cn(
                    "mt-1 flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-blue-400 hover:bg-blue-50",
                    isUploading && "pointer-events-none opacity-60"
                  )}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleThumbnailChange}
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      <span className="text-xs text-slate-500">Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                      <span className="text-xs text-slate-500">Nhấn để chọn ảnh</span>
                      <span className="text-xs text-slate-400">
                        JPG, PNG, WebP, GIF · Tối đa 5MB
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tags <span className="text-slate-400">({tags.length}/10)</span>
              </label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="Nhập tag rồi nhấn Enter..."
                className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
