import { useNavigate } from 'react-router'

export function useGoToParent(parentPath: string) {
  const navigate = useNavigate()

  return () => navigate(parentPath, { replace: true })
}
