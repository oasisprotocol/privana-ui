import { Layout } from '../../components/Layout'

export function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col flex-1 gap-4 justify-center items-center">
        <span className="text-foreground text-2xl font-medium">Page Not Found</span>
        <span className="text-sm text-muted-foreground">
          The page you are looking for does not exist. Please check the URL and try again.
        </span>
      </div>
    </Layout>
  )
}
