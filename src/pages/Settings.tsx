import { UserManagement } from "@/components/settings/UserManagement";
import { ApiKeySettings } from "@/components/settings/ApiKeySettings";

const Settings = () => {
  return (
    <div className="space-y-8">
      <ApiKeySettings />
      <UserManagement />
    </div>
  );
};

export default Settings;