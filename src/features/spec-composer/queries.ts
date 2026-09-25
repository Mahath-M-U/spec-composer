import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { loadProjects, removeProject } from "./persistence";

export const projectKeys = {
  all: ["projects"] as const,
};

// Local data only changes through our own writes, which invalidate this key
// via the storage change channel, so it never goes stale on its own.
export const projectsQueryOptions = () =>
  queryOptions({
    queryKey: projectKeys.all,
    queryFn: loadProjects,
    staleTime: Infinity,
  });

export function useRemoveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeProject(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
