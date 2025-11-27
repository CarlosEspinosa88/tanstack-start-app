import { useLogin } from "~/hooks/useLogin"
// import { login } from "~/server/login.server"



export default function Login() {
  const login = useLogin({
    // fn: loginFn,
    fn: async (variables: any) => {
      console.log('variables', variables)
    },
    onSuccess: ({ data }) => {
      console.log("Login success", data)
    }
  })
  return <div>Login</div>
} 