import { UserManagement } from "@/components/settings/UserManagement";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";
import { useRBAC } from "@/hooks/useRBAC";

const Settings = () => {
  const { role } = useRBAC();

  return (
    <div className="space-y-8">
      <ApiKeySettings />
      {role === 'superadmin' && <UserManagement />}
    </div>
  );
};

export default Settings;