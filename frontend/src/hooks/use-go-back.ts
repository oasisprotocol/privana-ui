import { useLocation, useNavigate } from 'react-router'

export function useGoBack(fallbackPath: string) {
  const navigate = useNavigate()
  const location = useLocation()

  return () => (location.key === 'default' ? navigate(fallbackPath) : navigate(-1))
}
