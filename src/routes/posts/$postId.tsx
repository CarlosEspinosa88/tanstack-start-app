import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostsComponentId,
})

export default function PostsComponentId() {
  return <div>Hello "/posts/$postId"!</div>
}
