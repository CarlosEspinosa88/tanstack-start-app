import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const {postId } = params
        return new Response(`Hello from the GET /posts/${postId} route!`)
      }
    },
  },
  // component: PostsComponentId,
})

// export default function PostsComponentId() {
//   return <div>Hello "/posts/$postId"!</div>
// }
