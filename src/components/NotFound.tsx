export function NotFound({ children }: { children?: any }) {
  return (
    <div>
      <div>
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
    </div>
  )
}