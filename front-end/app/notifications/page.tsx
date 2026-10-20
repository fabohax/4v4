'use client';
import { useI18n } from '@/lib/i18n';

export default function NotificationsPage() {
  const { t } = useI18n();
  // Placeholder notifications
  const notifications = [
    { id: 1, title: t("Welcome!"), message: t("Thanks for joining our platform.") },
    { id: 2, title: t("Profile Updated"), message: t("Your profile information was successfully updated.") },
    { id: 3, title: t("New Follower"), message: t("You have a new follower: @sketchfan123.") },
    { id: 4, title: t("Password Changed"), message: t("Your password was changed successfully.") },
    { id: 5, title: t("Export Complete"), message: t("Your 3D model export is ready for download.") },
  ];

  return (
    <div className="max-w-xl mx-auto my-24 p-8 bg-background rounded-2xl border border-[#333] shadow text-foreground">
      <h1 className="text-3xl font-bold mb-8">{t('Notifications')}</h1>
      <ul className="space-y-4">
        {notifications.map((n) => (
          <li
            key={n.id}
            className="p-4 rounded-xl border border-[#222] bg-background hover:bg-background/80 transition cursor-pointer select-none"
          >
            <div className="inline-block font-semibold text-sm mr-3">{n.title}</div>
            <div className="inline-block text-[#bbb] text-sm">{n.message}</div>
          </li>
        ))}
      </ul>
      {notifications.length === 0 && (
        <div className="text-center text-[#888] py-8">{t('No notifications yet.')}</div>
      )}
    </div>
  );
}
