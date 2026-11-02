import { useNavigate } from 'react-router'

export function useGoBack(parentPath: string) {
  const navigate = useNavigate()

  return () => navigate(parentPath)
}
