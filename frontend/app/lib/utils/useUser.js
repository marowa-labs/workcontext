import { useSupabaseUser } from "./useSupabaseUser";

const useUser = () => {
  // Always use Supabase user hook since we've migrated to Supabase
  return useSupabaseUser();
};

export { useUser };
export default useUser;
