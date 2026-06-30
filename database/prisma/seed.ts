import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PERMISSIONS_SEED = [
  { name: "View Dashboard", code: "dashboard.view", description: "Truy cập dashboard" },
  { name: "Create User", code: "user.create", description: "Tạo người dùng" },
  { name: "Read User", code: "user.read", description: "Xem người dùng" },
  { name: "Update User", code: "user.update", description: "Sửa người dùng" },
  { name: "Delete User", code: "user.delete", description: "Xóa người dùng" },
  { name: "Create Role", code: "role.create", description: "Tạo vai trò" },
  { name: "Read Role", code: "role.read", description: "Xem vai trò" },
  { name: "Update Role", code: "role.update", description: "Sửa vai trò" },
  { name: "Delete Role", code: "role.delete", description: "Xóa vai trò" },
  { name: "Read Permission", code: "permission.read", description: "Xem danh sách permissions" },
  { name: "Assign Permission", code: "permission.assign", description: "Gán permission vào role" },
  { name: "Create Article", code: "article.create", description: "Tạo bài viết" },
  { name: "Read Article", code: "article.read", description: "Xem bài nháp của mình" },
  { name: "Update Article", code: "article.update", description: "Sửa bài của mình" },
  { name: "Delete Article", code: "article.delete", description: "Xóa bài của mình" },
  { name: "Publish Article", code: "article.publish", description: "Xuất bản bài viết" },
  { name: "Manage All Articles", code: "article.manage", description: "CRUD tất cả bài viết" },
  { name: "Create Category", code: "category.create", description: "Tạo danh mục" },
  { name: "Read Category", code: "category.read", description: "Xem danh mục" },
  { name: "Update Category", code: "category.update", description: "Sửa danh mục" },
  { name: "Delete Category", code: "category.delete", description: "Xóa danh mục" },
  { name: "Upload File", code: "upload.file", description: "Upload file" },
  { name: "Update Profile", code: "profile.update", description: "Cập nhật hồ sơ" },
  { name: "Read Student", code: "student.read", description: "Xem học sinh" },
  { name: "Create Student", code: "student.create", description: "Tạo học sinh" },
  { name: "Update Student", code: "student.update", description: "Sửa học sinh" },
  { name: "Delete Student", code: "student.delete", description: "Xóa học sinh" },
  { name: "Read Subject", code: "subject.read", description: "Xem môn học" },
  { name: "Create Subject", code: "subject.create", description: "Tạo môn học" },
  { name: "Update Subject", code: "subject.update", description: "Sửa môn học" },
  { name: "Delete Subject", code: "subject.delete", description: "Xóa môn học" },
  { name: "Read Course", code: "course.read", description: "Xem khóa học" },
  { name: "Create Course", code: "course.create", description: "Tạo khóa học" },
  { name: "Update Course", code: "course.update", description: "Sửa khóa học" },
  { name: "Delete Course", code: "course.delete", description: "Xóa khóa học" },
];

const ROLES_SEED = [
  { name: "Super Admin", description: "Toàn quyền hệ thống", isSystem: true },
  { name: "Admin", description: "Quản lý người dùng & nội dung", isSystem: true },
  { name: "Editor", description: "Quản lý bài viết", isSystem: true },
  { name: "Teacher", description: "Giáo viên", isSystem: true },
  { name: "Student", description: "Học sinh", isSystem: true },
  { name: "Parent", description: "Phụ huynh", isSystem: true },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  "Super Admin": [
    "dashboard.view",
    "user.create",
    "user.read",
    "user.update",
    "user.delete",
    "role.create",
    "role.read",
    "role.update",
    "role.delete",
    "permission.read",
    "permission.assign",
    "article.create",
    "article.read",
    "article.update",
    "article.delete",
    "article.publish",
    "article.manage",
    "category.create",
    "category.read",
    "category.update",
    "category.delete",
    "upload.file",
    "profile.update",
    "student.read",
    "student.create",
    "student.update",
    "student.delete",
    "subject.read",
    "subject.create",
    "subject.update",
    "subject.delete",
    "course.read",
    "course.create",
    "course.update",
    "course.delete",
  ],
  Admin: [
    "dashboard.view",
    "user.create",
    "user.read",
    "user.update",
    "user.delete",
    "role.create",
    "role.read",
    "role.update",
    "role.delete",
    "permission.read",
    "permission.assign",
    "article.create",
    "article.read",
    "article.update",
    "article.delete",
    "article.publish",
    "article.manage",
    "category.create",
    "category.read",
    "category.update",
    "category.delete",
    "upload.file",
    "profile.update",
    "student.read",
    "student.create",
    "student.update",
    "student.delete",
    "subject.read",
    "subject.create",
    "subject.update",
    "subject.delete",
    "course.read",
    "course.create",
    "course.update",
    "course.delete",
  ],
  Editor: [
    "dashboard.view",
    "article.create",
    "article.read",
    "article.update",
    "article.delete",
    "article.publish",
    "category.read",
    "upload.file",
    "profile.update",
  ],
  Teacher: [
    "dashboard.view",
    "article.create",
    "article.read",
    "article.update",
    "upload.file",
    "profile.update",
  ],
  Student: ["dashboard.view", "profile.update"],
  Parent: ["dashboard.view", "profile.update"],
};

const DEFAULT_CATEGORIES = [
  { name: "Thông báo", slug: "thong-bao" },
  { name: "Tin tức", slug: "tin-tuc" },
  { name: "Học bổng", slug: "hoc-bong" },
  { name: "Sự kiện", slug: "su-kien" },
  { name: "Tuyển sinh", slug: "tuyen-sinh" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Seed permissions
  console.log("  → Seeding permissions...");
  for (const perm of PERMISSIONS_SEED) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  // 2. Seed roles
  console.log("  → Seeding roles...");
  for (const role of ROLES_SEED) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // 3. Assign permissions to roles
  console.log("  → Assigning permissions to roles...");
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const code of permCodes) {
      const perm = await prisma.permission.findUnique({ where: { code } });
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // 4. Seed default users
  console.log("  → Seeding default users...");
  const defaultUsers = [
    {
      email: "superadmin@school.com",
      password: "Admin@123456",
      firstName: "Super",
      lastName: "Admin",
      role: "Super Admin",
    },
    {
      email: "admin@school.com",
      password: "Admin@123456",
      firstName: "School",
      lastName: "Admin",
      role: "Admin",
    },
    {
      email: "editor@school.com",
      password: "Editor@123456",
      firstName: "Content",
      lastName: "Editor",
      role: "Editor",
    },
  ];

  let adminUser = null;
  for (const u of defaultUsers) {
    const hash = await bcrypt.hash(u.password, 12);
    const existing = await prisma.user.findUnique({ where: { email: u.email } });

    let user;
    if (existing) {
      user = existing;
    } else {
      user = await prisma.user.create({
        data: {
          email: u.email,
          password: hash,
          firstName: u.firstName,
          lastName: u.lastName,
          status: "ACTIVE",
        },
      });
    }

    if (u.role === "Admin") adminUser = user;

    const role = await prisma.role.findUnique({ where: { name: u.role } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }

  // 5. Seed categories
  console.log("  → Seeding categories...");
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 6. Seed articles
  console.log("  → Seeding articles...");
  if (adminUser) {
    const thongBao = await prisma.category.findUnique({ where: { slug: "thong-bao" } });
    const tinTuc = await prisma.category.findUnique({ where: { slug: "tin-tuc" } });

    const articles = [
      {
        title: "Khai giảng năm học mới 2025-2026",
        slug: "khai-giang-nam-hoc-moi-2025-2026",
        excerpt: "Thông báo về lễ khai giảng năm học mới 2025-2026.",
        content:
          "<p>Trường Trung học phổ thông ABC trân trọng thông báo lịch khai giảng năm học mới 2025-2026.</p><p>Lễ khai giảng sẽ diễn ra vào ngày 05/09/2025 tại sân trường.</p><p>Toàn thể học sinh, giáo viên và phụ huynh vui lòng có mặt đúng giờ.</p>",
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        tags: ["khai giảng", "thông báo", "năm học mới"],
        authorId: adminUser.id,
        categoryId: thongBao?.id,
      },
      {
        title: "Học bổng xuất sắc học kỳ 1 năm 2025",
        slug: "hoc-bong-xuat-sac-hoc-ky-1-nam-2025",
        excerpt: "Danh sách học sinh nhận học bổng xuất sắc học kỳ 1 năm 2025.",
        content:
          "<p>Nhà trường xin chúc mừng các học sinh xuất sắc đã đạt học bổng học kỳ 1 năm học 2025.</p><ul><li>Nguyễn Văn A - Lớp 12A1</li><li>Trần Thị B - Lớp 11B2</li><li>Lê Minh C - Lớp 10C3</li></ul><p>Học bổng sẽ được trao vào ngày 15/01/2025.</p>",
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        tags: ["học bổng", "xuất sắc"],
        authorId: adminUser.id,
        categoryId: tinTuc?.id,
      },
      {
        title: "Cuộc thi Toán học Quốc tế 2025",
        slug: "cuoc-thi-toan-hoc-quoc-te-2025",
        excerpt: "Thông tin về cuộc thi Toán học Quốc tế dành cho học sinh THPT.",
        content:
          '<p>Cuộc thi Toán học Quốc tế 2025 sẽ được tổ chức vào tháng 3/2025.</p><p>Đây là cơ hội tuyệt vời để các em học sinh thể hiện tài năng và giao lưu với bạn bè quốc tế.</p><blockquote><p>"Toán học là ngôn ngữ của vũ trụ"</p></blockquote>',
        status: "PUBLISHED" as const,
        publishedAt: new Date(),
        tags: ["toán học", "cuộc thi", "quốc tế"],
        authorId: adminUser.id,
        categoryId: tinTuc?.id,
      },
      {
        title: "Kế hoạch tuyển sinh lớp 10 năm 2026",
        slug: "ke-hoach-tuyen-sinh-lop-10-nam-2026",
        excerpt: "Thông tin tuyển sinh lớp 10 năm học 2025-2026 đang được chuẩn bị.",
        content:
          "<p>Nhà trường đang trong quá trình chuẩn bị kế hoạch tuyển sinh lớp 10 năm học 2025-2026.</p><p>Thông tin chi tiết sẽ được công bố sớm.</p>",
        status: "DRAFT" as const,
        publishedAt: null,
        tags: ["tuyển sinh", "lớp 10"],
        authorId: adminUser.id,
        categoryId: null,
      },
    ];

    for (const article of articles) {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {},
        create: article,
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
