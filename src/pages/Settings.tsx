import { InviteUser } from "@/components/settings/InviteUser";
import { UserManagement } from "@/components/settings/UserManagement";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { useRBAC } from "@/hooks/useRBAC";

const Settings = () => {
  const { role } = useRBAC();

  return (
    <div className="space-y-8">
      <ApiKeySettings />
      {role === 'superadmin' && (
        <>
          <InviteUser />
          <UserManagement />
        </>
      )}
    </div>
  );
};

export default Settings;