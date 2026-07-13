// [M5] Định nghĩa rule cho các badge (achievement).
// Mỗi badge có 1 hàm check(ctx) thuần, trả về true/false dựa trên context hiện tại.
// ctx = { completedCount: number, streak: number, categories: Set<string> }

export const BADGES = [
  {
    id: 'newbie',
    title: 'Người mới',
    description: 'Hoàn thành trải nghiệm đầu tiên',
    icon: 'emoticon-happy-outline',
    check: (ctx) => ctx.completedCount >= 1,
  },
  {
    id: 'explorer',
    title: 'Khám phá gia',
    description: 'Hoàn thành 5 trải nghiệm',
    icon: 'compass-outline',
    check: (ctx) => ctx.completedCount >= 5,
  },
  {
    id: 'streak3',
    title: 'Chuỗi 3 ngày',
    description: 'Xác nhận có mặt 3 ngày liên tiếp không nghỉ',
    icon: 'fire',
    check: (ctx) => ctx.streak >= 3,
  },
  {
    id: 'allCategory',
    title: 'Đủ 4 danh mục',
    description: 'Hoàn thành trải nghiệm ở 4 danh mục khác nhau',
    icon: 'shape-outline',
    check: (ctx) => ctx.categories.size >= 4,
  },
];

export function getBadgeById(id) {
  return BADGES.find((b) => b.id === id) ?? null;
}
